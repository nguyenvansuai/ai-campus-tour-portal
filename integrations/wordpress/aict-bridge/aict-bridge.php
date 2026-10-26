<?php
/**
 * Plugin Name: AICT Bridge (AI Campus Tour)
 * Description: Báo về portal AI Campus Tour khi học viên hoàn thành khóa Sự AI trên Tutor LMS, để SV được miễn trắc nghiệm trên portal.
 * Version: 1.0.0
 * Author: Sự AI
 * Requires PHP: 7.4
 *
 * Cài đặt: Cài đặt → AICT Bridge. Secret phải trùng SUAI_BRIDGE_SECRET trên portal
 * (có thể đặt bằng hằng số AICT_BRIDGE_SECRET trong wp-config.php thay cho ô nhập).
 */

if (!defined('ABSPATH')) {
	exit;
}

const AICT_BRIDGE_OPTION = 'aict_bridge_settings';
const AICT_BRIDGE_QUEUE = 'aict_bridge_queue';
const AICT_BRIDGE_CRON = 'aict_bridge_retry';

function aict_bridge_settings() {
	$defaults = array(
		'portal_url' => 'https://aicampustour.suai.vn',
		'secret' => '',
		'course_ids' => '3584,3599',
	);
	$settings = wp_parse_args(get_option(AICT_BRIDGE_OPTION, array()), $defaults);
	if (defined('AICT_BRIDGE_SECRET') && AICT_BRIDGE_SECRET) {
		$settings['secret'] = AICT_BRIDGE_SECRET;
	}
	return $settings;
}

function aict_bridge_course_ids() {
	$ids = array_map('trim', explode(',', aict_bridge_settings()['course_ids']));
	return array_filter($ids, 'strlen');
}

/**
 * Tutor LMS gọi hook này khi học viên bấm hoàn thành khóa (Tutor Free và Pro).
 * Kiểm lại tên hook nếu nâng cấp Tutor: tìm "tutor_course_complete_after" trong mã nguồn Tutor.
 */
add_action('tutor_course_complete_after', 'aict_bridge_on_course_complete', 10, 2);

function aict_bridge_on_course_complete($course_id, $user_id) {
	if (!in_array((string) $course_id, aict_bridge_course_ids(), true)) {
		return;
	}
	$user = get_userdata($user_id);
	if (!$user || !is_email($user->user_email)) {
		return;
	}
	$payload = array(
		'event' => 'course_completed',
		'eventId' => 'tutor-' . $course_id . '-' . $user_id,
		'email' => strtolower($user->user_email),
		'courseId' => (string) $course_id,
		'completedAt' => gmdate('c'),
	);
	if (!aict_bridge_send($payload)) {
		aict_bridge_enqueue($payload);
	}
}

/** Gửi 1 sự kiện. Trả về true khi portal đã nhận (kể cả trùng hoặc khóa không tính). */
function aict_bridge_send($payload) {
	$settings = aict_bridge_settings();
	if (strlen($settings['secret']) < 32) {
		return false;
	}
	$body = wp_json_encode($payload);
	$timestamp = (string) time();
	$signature = hash_hmac('sha256', $timestamp . '.' . $body, $settings['secret']);
	$response = wp_remote_post(
		untrailingslashit($settings['portal_url']) . '/api/tich-hop/suai/hoan-thanh',
		array(
			'timeout' => 10,
			'headers' => array(
				'Content-Type' => 'application/json',
				'X-AICT-Timestamp' => $timestamp,
				'X-AICT-Signature' => $signature,
			),
			'body' => $body,
		)
	);
	if (is_wp_error($response)) {
		return false;
	}
	$code = wp_remote_retrieve_response_code($response);
	// 400: payload sai, gửi lại cũng vô ích nên bỏ.
	return $code === 200 || $code === 400;
}

function aict_bridge_enqueue($payload) {
	$queue = get_option(AICT_BRIDGE_QUEUE, array());
	$queue[$payload['eventId']] = $payload;
	update_option(AICT_BRIDGE_QUEUE, array_slice($queue, -500, null, true), false);
}

/** Gửi lại các sự kiện lỗi mạng mỗi giờ. */
add_action(AICT_BRIDGE_CRON, 'aict_bridge_retry_queue');

function aict_bridge_retry_queue() {
	$queue = get_option(AICT_BRIDGE_QUEUE, array());
	foreach ($queue as $event_id => $payload) {
		if (aict_bridge_send($payload)) {
			unset($queue[$event_id]);
		}
	}
	update_option(AICT_BRIDGE_QUEUE, $queue, false);
}

register_activation_hook(__FILE__, function () {
	if (!wp_next_scheduled(AICT_BRIDGE_CRON)) {
		wp_schedule_event(time() + 300, 'hourly', AICT_BRIDGE_CRON);
	}
});

register_deactivation_hook(__FILE__, function () {
	wp_clear_scheduled_hook(AICT_BRIDGE_CRON);
});

// ---------------------------------------------------------------------------
// Trang cài đặt

add_action('admin_menu', function () {
	add_options_page('AICT Bridge', 'AICT Bridge', 'manage_options', 'aict-bridge', 'aict_bridge_settings_page');
});

add_action('admin_init', function () {
	register_setting('aict_bridge', AICT_BRIDGE_OPTION, array(
		'sanitize_callback' => function ($input) {
			$current = aict_bridge_settings();
			return array(
				'portal_url' => esc_url_raw($input['portal_url'] ?? $current['portal_url']),
				// Để trống ô secret thì giữ secret cũ (không hiện lại secret trên trang).
				'secret' => !empty($input['secret']) ? sanitize_text_field($input['secret']) : $current['secret'],
				'course_ids' => preg_replace('/[^0-9,]/', '', $input['course_ids'] ?? $current['course_ids']),
			);
		},
	));
});

function aict_bridge_settings_page() {
	if (!current_user_can('manage_options')) {
		return;
	}
	if (isset($_POST['aict_bridge_test']) && check_admin_referer('aict_bridge_test')) {
		$ok = aict_bridge_send(array(
			'event' => 'course_completed',
			'eventId' => 'test-' . time(),
			'email' => 'kiem-tra-ket-noi@suai.vn',
			'courseId' => '0',
		));
		echo '<div class="notice ' . ($ok ? 'notice-success' : 'notice-error') . '"><p>' . ($ok ? 'Kết nối portal thành công.' : 'Không kết nối được portal. Kiểm tra URL và secret.') . '</p></div>';
	}
	$settings = aict_bridge_settings();
	$queue = get_option(AICT_BRIDGE_QUEUE, array());
	?>
	<div class="wrap">
		<h1>AICT Bridge – kết nối portal AI Campus Tour</h1>
		<form method="post" action="options.php">
			<?php settings_fields('aict_bridge'); ?>
			<table class="form-table">
				<tr>
					<th><label for="aict_portal_url">URL portal</label></th>
					<td><input id="aict_portal_url" class="regular-text" name="<?php echo esc_attr(AICT_BRIDGE_OPTION); ?>[portal_url]" value="<?php echo esc_attr($settings['portal_url']); ?>"></td>
				</tr>
				<tr>
					<th><label for="aict_secret">Secret</label></th>
					<td>
						<input id="aict_secret" type="password" class="regular-text" autocomplete="off" name="<?php echo esc_attr(AICT_BRIDGE_OPTION); ?>[secret]" placeholder="<?php echo $settings['secret'] ? 'Đã đặt – để trống để giữ nguyên' : 'Dán SUAI_BRIDGE_SECRET của portal'; ?>">
						<p class="description">Phải trùng biến SUAI_BRIDGE_SECRET trên portal (ít nhất 32 ký tự).</p>
					</td>
				</tr>
				<tr>
					<th><label for="aict_course_ids">ID khóa Tutor</label></th>
					<td><input id="aict_course_ids" class="regular-text" name="<?php echo esc_attr(AICT_BRIDGE_OPTION); ?>[course_ids]" value="<?php echo esc_attr($settings['course_ids']); ?>"><p class="description">Cách nhau bằng dấu phẩy. Mặc định 3584 (video), 3599 (trực tuyến).</p></td>
				</tr>
			</table>
			<?php submit_button(); ?>
		</form>
		<form method="post">
			<?php wp_nonce_field('aict_bridge_test'); ?>
			<p>Sự kiện đang chờ gửi lại: <?php echo count($queue); ?></p>
			<?php submit_button('Kiểm tra kết nối', 'secondary', 'aict_bridge_test'); ?>
		</form>
	</div>
	<?php
}
