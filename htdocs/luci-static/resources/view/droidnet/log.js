/* This is free software, licensed under the Apache License, Version 2.0
 *
 * Copyright (C) 2024 Hilman Maulana <hilman0.0maulana@gmail.com>
 */

'use strict';
'require fs';
'require ui';
'require view';
'require poll';

return view.extend({
	handleSaveApply: null,
	handleSave: null,
	handleReset: null,
	load: function() {
		return Promise.all([
			fs.read('/var/log/droidnet.log').then(function(result) {
				if (!result || result.trim() === '') {
					ui.addNotification(null, E('p', _('Unable to read the interface info from /var/log/droidnet.log.')));
					return null;
				} else {
					var data = result.trim();
					return data;
				}
			}).catch(function(error) {
				ui.addNotification(null, E('p', _('An error occurred while reading the file') + `: ${error}`));
				return null;
			})
		]);
	},
	render: function(info) {
		var header = [
			E('h2', {'class': 'section-title'}, _('DroidNet')),
			E('div', {'class': 'cbi-map-descr'}, _('Manage Android modem and optimize network settings.'))
		];
		var menu = [
			E('label', {'for': 'log-direction', 'style': 'margin-right: 8px;'}, _('Log Direction') + ' : '),
			E('select', {'id': 'log-direction', 'style': 'margin-right: 8px;'}, [
				E('option', {'value': 'down', 'selected': 'selected'}, _('Down')),
				E('option', {'value': 'up' }, _('Up'))
			]),
			E('button', {
				'class': 'cbi-button cbi-button-save',
				'click': function() {
					var logs = document.getElementById('syslog').value;
					var blob = new Blob([logs], {type: 'text/plain'});
					var link = document.createElement('a');
					link.href = window.URL.createObjectURL(blob);
					link.download = 'droidnet.log';
					link.click();
				}
			}, _('Download Log'))
		];
		var body = [
			E('textarea', {
				'id': 'syslog',
				'class': 'cbi-input-textarea',
				'style': 'height: 500px; overflow-y: scroll;',
				'readonly': 'readonly',
				'wrap': 'off',
				'rows': 1
			}, [ info ])
		];
		poll.add(function() {
			var log = document.getElementById('log-direction');
			var syslog = document.getElementById('syslog');
			if (log) {
				var value = log.value;
				if (value === 'up') {
					var value = syslog.value.split('\n').reverse().join('\n');
					console.log(info)
					syslog.innerHTML = value;
				}
			}
		});
		return E('div', {'class': 'cbi-map'}, [
			E(header),
			E('div', {'class': 'cbi-section'}, [
				E('div', {'class': 'cbi-control', 'style': 'padding: 1rem;'}, menu),
				E('div', {'class': 'cbi-body'}, body)
			])
		])
	}
});
