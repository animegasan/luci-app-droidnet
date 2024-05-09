/* This is free software, licensed under the Apache License, Version 2.0
 *
 * Copyright (C) 2024 Hilman Maulana <hilman0.0maulana@gmail.com>
 */

'use strict';
'require form';
'require uci';
'require view';
'require fs';
'require tools.widgets as widgets';

return view.extend({
	load: function() {
		return Promise.all([
			uci.load('droidnet'),
			fs.exec('adb', ['devices', '-l']).then(function(result) {
				var stdout = result.stdout.trim();
				if (result.stderr) {
					console.error('Error:', result.stderr);
					return null;
				} else {
					var lines = stdout.split('\n');
					lines.shift(); // Hapus baris pertama ("List of devices attached")
					var devices = [];
					lines.forEach(function(line) {
						var parts = line.split(/\s+/); // Pisahkan setiap bagian dengan spasi
						var device = parts[0].trim(); // Ambil perangkat
						var model = '';
						parts.forEach(function(part) {
							if (part.startsWith('model:')) {
								model = part.substring(6);
							}
						});
						devices.push({ device: device, model: model });
					});
					return devices.length > 0 ? devices : null;
				}
			}).catch(function(error) {
				console.error('Error:', error);
				return null;
			})
		]);
	},

	render: function(data) {
		var m, s, o;

		m = new form.Map('droidnet', _('DroidNet'),
			_('Manage Android modem and optimize network settings.'));

		s = m.section(form.NamedSection, 'config', 'droidnet', _('Base Setting'));
		if (data && data[1] && Array.isArray(data[1])) {
			o = s.option(form.ListValue, 'device', _('Device'));
			o.rmempty = false;
			data[1].forEach(function(entry) {
				if (entry.device) {
					o.value(entry.device, entry.model); // Use device value as value and model as label
				}
			});
		};

		s = m.section(form.NamedSection, 'config', 'droidnet',
			_('Monitoring Service'));
		o = s.option(form.DummyValue, 'service_status', _('Status'));

		o = s.option(form.Flag, 'enabled', _('Enable'));
		o.default = '0';
		o.rmempty = false;

		o = s.option(form.Value, 'host', _('Host'),
			_('Host address you want to ping. Recommended to use bug on Tun.'));
		o.placeholder = _('Host address');

		o = s.option(form.ListValue, 'failed_count', _('Max ping attempts'),
			_('Maximum number of unsuccessful ping attempts to trigger the service.'));
		o.value('1', _('1 attempts'));
		o.value('2', _('2 attempts'));
		o.value('3', _('3 attempts'));
		o.value('4', _('4 attempts'));
		o.value('5', _('5 attempts'));
		o.default = '1';

		o = s.option(form.ListValue, 'wait_time', _('Waiting time'),
			_('Time to wait (in seconds) before activating airplane mode after ping failure.'));
		o.value('1', _('1 seconds'));
		o.value('2', _('2 seconds'));
		o.value('3', _('3 seconds'));
		o.default = '1';

		o = s.option(widgets.NetworkSelect, 'interface', _('Interface'),
			_('Name of interface to be restarted.'));
		o.nocreate = true;
		o.rmempty = false;

		o = s.option(form.Flag, 'restart', _('Restart the tunnel'),
			_('Enable to automatically restart the tunneling tool.'));
		o.default = '0';

		o = s.option(form.ListValue, 'tunnel_service', _('Tunneling tool'),
			_('Select the name of the tunneling tool to be restarted.'));
		o.value('', _('Select tunneling tool'));
		o.value('openclash', _('OpenClash'));
		o.value('passwall', _('PassWall'));
		o.value('neko', _('Neko'));
		o.value('v2raya', _('V2RayA'));
		o.depends('restart', '1');
		o.rmempty = false;

		return m.render();
	}
});
