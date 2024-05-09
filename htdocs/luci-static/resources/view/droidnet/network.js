/* This is free software, licensed under the Apache License, Version 2.0
 *
 * Copyright (C) 2024 Hilman Maulana <hilman0.0maulana@gmail.com>
 */

'use strict';
'require view';
'require fs';
'require uci';
'require ui';

return view.extend({
	handleSaveApply: null,
	handleSave: null,
	handleReset: null,
	load: function() {
		return uci.load('droidnet').then(function () {
			var device = uci.get('droidnet', 'config', 'device');
			return Promise.all([
				fs.exec('adb', ['-s', device, 'shell', 'getprop']).then(function(result) {
					var deviceInfo = {};
					var stderr = result.stderr;
					var stdout = result.stdout;
					var properties = {
						'gsm.operator.alpha': 'operator',
						'gsm.network.type': 'network',
						'gsm.version.ril-impl': 'driver',
						'gsm.operator.isroaming': 'roaming',
						'gsm.sim.operator.numeric': 'mcc',
						'ro.build.version.sdk': 'sdk'
					};
					if (stderr) {
						deviceInfo['device-section'] = stderr;
						return deviceInfo;
					} else {
						var lines = stdout.split('\n');
						for (var i = 0; i < lines.length; i++) {
							for (var property in properties) {
								if (lines[i].includes('[' + property + ']')) {
									var parts = lines[i].split(']: [');
									var value = parts[1].substring(0, parts[1].length - 1);
									if (value.includes(',')) {
										value = value.split(',').map(function(item) {
											return item.trim();
										});
									}
									deviceInfo[properties[property]] = value;
									break;
								}
							}
						}
						return deviceInfo;
					}
				}).catch(function(error) {
					return {error};
				}),
				fs.exec('adb', ['-s', device, 'shell', 'settings', 'list', 'global']).then(function(result) {
					var settingInfo = {};
					var stderr = result.stderr;
					var stdout = result.stdout;
					var properties = {
						'airplane_mode_on': 'airplane',
						'mobile_data1': 'sim1',
						'mobile_data2': 'sim2'
					};
					if (stderr) {
						settingInfo['setting-section'] = stderr;
						return settingInfo;
					} else {
						var lines = stdout.split('\n');
						for (var i = 0; i < lines.length; i++) {
							for (var property in properties) {
								if (lines[i].includes(property + '=')) {
									var parts = lines[i].split('=');
									var value = parts[1];
									if (value === '0') {
										value = 'false';
									} else if (value === '1') {
										value = 'true';
									}
									if (value.includes(',')) {
										value = value.split(',').map(function(item) {
											return item.trim();
										});
									}
									settingInfo[properties[property]] = value;
									break;
								}
							}
						}
						return settingInfo;
					}
				}).catch(function(error) {
					return {error};
				}),
				fs.exec('adb', ['-s', device, 'shell', 'service', 'call', 'iphonesubinfo', '1', 's16', 'com.android.shell']).then(function(result) {
					var imeiInfo = {};
					var stderr = result.stderr;
					var stdout = result.stdout;
					if (stderr) {
						imeiInfo['imei01-section'] = stderr;
						return imeiInfo;
					} else {
						var matches = stdout.match(/'([^']+)'/g);
						var value = matches.map(function(match) {
							return match.slice(1, -1);
						});
						var combined = value.join('');
						var imei = combined.replace(/[.\s]/g, '');
						imeiInfo['imei01'] = imei;
						return imeiInfo;
					}
				}).catch(function(error) {
					return {error};
				}),
				fs.exec('adb', ['-s', device, 'shell', 'ip', 'route']).then(function(result) {
					var ipInfo = {};
					var stderr = result.stderr;
					var stdout = result.stdout;
					if (result && stdout) {
						var parts = stdout.trim().split(/\s+/);
						var srcIndex = parts.indexOf('src');
						if (srcIndex !== -1) {
							var srcValue = parts[srcIndex + 1];
							ipInfo['data'] = 'true';
							ipInfo['ip'] = srcValue;
						}
						return ipInfo;
					} else if (result && stderr) {
						ipInfo['ip-section'] = stderr;
						ipInfo['data'] = null;
						return ipInfo;
					} else {
						ipInfo['data'] = 'false';
						return ipInfo;
					}
				}).catch(function(error) {
					return {error};
				})
			]).then(function(results) {
				var deviceInfo = results[0];
				var settingInfo = results[1];
				var imeiInfo = results[2];
				var ipInfo = results[3];
				if (deviceInfo && settingInfo && imeiInfo && ipInfo) {
					var mergedInfo = Object.assign({}, deviceInfo, settingInfo, imeiInfo, ipInfo);
					mergedInfo.device = device;
					return mergedInfo;
				} else {
					throw new Error(_('Failed to get complete device information.'));
				}
			}).catch(function(error) {
				return {error};
			});
		});
	},
	render: function(data) {
		var header = [
			E('h2', {'class': 'section-title'}, _('DroidNet')),
			E('div', {'class': 'cbi-map-descr'}, _('Manage Android modem and optimize network settings.'))
		];
		var log = '/var/log/droidnet.log';
		var date = new Date().toLocaleDateString(undefined, {
			weekday: 'short',
			month: 'short',
			day: 'numeric'
		});
		var time = new Date().toLocaleTimeString(undefined, {
			hour: '2-digit',
			minute: '2-digit'
		});
		var network = [
			E('h3', {'class': 'section-title'}, _('Mobile Network')),
			E('table', {'class': 'table cbi-section-table'}, [
				E('tr', {'class': 'tr table-title', 'style': 'display: none;'}),
				E('tr', {'class': 'tr cbi-rowstyle-1'}, [
					E('td', {'class': 'td left', 'width': '50%'}, _('IP Address')),
					E('td', {'class': 'td left', 'colspan': '2'}, data.ip || '-')
				]),
				E('tr', {'class': 'tr cbi-rowstyle-2'}, [
					E('td', {'class': 'td left', 'width': '50%'}, _('IMEI')),
					E('td', {'class': 'td left', 'colspan': '2'}, data.imei01 || '-')
				]),
				E('tr', {'class': 'tr cbi-rowstyle-1'}, [
					E('td', {'class': 'td left', 'width': '50%'}, _('Mobile network')),
					E('td', {'class': 'td left'},
					(data.data === 'true') ? _('On') : (
						(data.data === 'false') ? _('Off') : '-')),
					E('td', {'class': 'td'}, [
						(data.data === 'false') ? E('button', {
							'class': 'btn cbi-button cbi-button-action',
							'click': function() {
								if (data.airplane === 'true') {
									ui.addNotification(_('Error on setting data mode!'),
									E('p', _('Not avaialble when the airplane mode is enabled.')),
									'danger');
									fs.read(log).then(function(result) {
										var message = _('Failed to switch on mobile network because the device is in airplane mode.');
										var notif = `${date}, ${time} - ${message}`;
										var newData = result.trim() + '\n' + notif;
										return fs.write(log, newData);
									});
								} else {
									fs.exec('adb', ['-s', data.device, 'shell', 'svc', 'data', 'enable']);
									fs.read(log).then(function(result) {
										var message = _('Mobile network has been switched on.');
										var notif = `${date}, ${time} - ${message}`;
										var newData = result.trim() + '\n' + notif;
										return fs.write(log, newData);
									});
									ui.showModal(_('Turning on mobile network'), [
										E('p', {'class': 'spinning'}, _('Waiting for mobile network to be turned on…'))
									]);
									setTimeout(function() {
										ui.showModal(_('Mobile network has been switched on'), [
											E('p', _('The mobile network has been successfully switched on.')),
											E('div', {'class': 'right'}, [
												E('button', {
													'class': 'btn',
													'click': function() {
														return window.location.reload();
													}
												}, _('OK'))
											])
										]);
									}, 5000);
								}
							}
						}, _('Enable')) : '',
						(data.data === 'true') ? E('button', {
							'class': 'btn cbi-button cbi-button-remove',
							'click': function() {
								fs.exec('adb', ['-s', data.device, 'shell', 'svc', 'data', 'disable']);
								fs.read(log).then(function(result) {
									var message = _('Mobile network has been switched off.');
									var notif = `${date}, ${time} - ${message}`;
									var newData = result.trim() + '\n' + notif;
									return fs.write(log, newData);
								});
								ui.showModal(_('Turning off mobile network'), [
									E('p', {'class': 'spinning'}, _('Waiting for mobile network to be turned off…'))
								]);
								setTimeout(function() {
									ui.showModal(_('Mobile network has been switched off'), [
										E('p', _('The mobile network has been successfully switched off.')),
										E('div', {'class': 'right'}, [
											E('button', {
												'class': 'btn',
												'click': function() {
													return window.location.reload();
												}
											}, _('OK'))
										])
									]);
								}, 5000);
							}
						}, _('Disable')) : ''
					])
				]),
				E('tr', {'class': 'tr cbi-rowstyle-2'}, [
					E('td', {'class': 'td left', 'width': '50%'}, _('Airplane mode')),
					E('td', {'class': 'td left'},
					(data.airplane === 'true') ? _('On') : (
						(data.airplane === 'false') ? _('Off') : '-')),
					E('td', {'class': 'td'}, [
						(data.airplane === 'false') ? E('button', {
							'class': 'btn cbi-button cbi-button-action',
							'click': function() {
								fs.exec('adb', ['-s', data.device, 'shell', 'cmd', 'connectivity', 'airplane-mode', 'enable']).then(function(result) {
									if (result.stdout) {
										ui.addNotification(_('Error on setting airplane mode!'), [
											E('p', _('Device version cannot execute the command, make sure device is rooted or Android version is 10 or above.')),
											E('p', result.stdout)
										], 'danger');
										fs.read(log).then(function(result) {
											var message = _('Failed to turn on airplane mode because the device Android version is below 10.');
											var notif = `${date}, ${time} - ${message}`;
											var newData = result.trim() + '\n' + notif;
											return fs.write(log, newData);
										});
									} else {
										fs.read(log).then(function(result) {
											var message = _('Airplane mode has been switched on.');
											var notif = `${date}, ${time} - ${message}`;
											var newData = result.trim() + '\n' + notif;
											return fs.write(log, newData);
										});
										ui.showModal(_('Turning on Airplane mode'), [
											E('p', {'class': 'spinning'}, _('Waiting for airplane mode to be turned on…'))
										]);
										setTimeout(function() {
											ui.showModal(_('Airplane mode has been switched on'), [
												E('p', _('The airplane mode has been successfully switched on.')),
												E('div', {'class': 'right'}, [
													E('button', {
														'class': 'btn',
														'click': function() {
															return window.location.reload();
														}
													}, _('OK'))
												])
											]);
										}, 5000);
									}
								})
							}
						}, _('Enable')) : '',
						(data.airplane === 'true') ? E('button', {
							'class': 'btn cbi-button cbi-button-remove',
							'click': function() {
								fs.exec('adb', ['-s', data.device, 'shell', 'cmd', 'connectivity', 'airplane-mode', 'disable']).then(function(result) {
									if (result.stdout) {
										ui.addNotification(_('Error on setting airplane mode!'), [
											E('p', _('Device version cannot execute the command, make sure device is rooted or Android version is 10 or above.')),
											E('p', result.stdout)
										], 'danger');
										fs.read(log).then(function(result) {
											var message = _('Failed to turn off airplane mode because the device Android version is below 10.');
											var notif = `${date}, ${time} - ${message}`;
											var newData = result.trim() + '\n' + notif;
											return fs.write(log, newData);
										});
									} else {
										fs.read(log).then(function(result) {
											var message = _('Airplane mode has been switched off.');
											var notif = `${date}, ${time} - ${message}`;
											var newData = result.trim() + '\n' + notif;
											return fs.write(log, newData);
										});
										ui.showModal(_('Turning off Airplane mode'), [
											E('p', {'class': 'spinning'}, _('Waiting for airplane mode to be turned off…'))
										]);
										setTimeout(function() {
											ui.showModal(_('Airplane mode has been switched off'), [
												E('p', _('The airplane mode has been successfully switched off.')),
												E('div', {'class': 'right'}, [
													E('button', {
														'class': 'btn',
														'click': function() {
															return window.location.reload();
														}
													}, _('OK'))
												])
											]);
										}, 5000);
									}
								})
							}
						}, _('Disable')) : ''
					])
				])
			])
		]
		var cell = [
			E('h3', {'class': 'section-title'}, _('Cellular Information')),
			E('ul', {'class': 'cbi-tabmenu'}, [
				(data.sim1 === 'true') ? E('li', {'class': 'cbi-tab'}, [
					E('a', {
						'href': '#',
						'click': function() {
							var tab1 = document.getElementsByClassName('cbi-tab');
							for (var i = 0; i < tab1.length; i++) {
								tab1[i].className = 'cbi-tab-disabled';
							}
							var tab2 = document.getElementsByClassName('cbi-tab-disabled');
							for (var i = 0; i < tab2.length; i++) {
								tab2[i].className = 'cbi-tab';
							}
							document.getElementById('sim-1').style.display = 'table';
							document.getElementById('sim-2').style.display = 'none';
						}
					}, _('SIM 1'))
				]) : '',
				(data.sim2 === 'true') ? E('li', {'class': 'cbi-tab-disabled'}, [
					E('a', {
						'href': '#',
						'click': function() {
							var tab1 = document.getElementsByClassName('cbi-tab-disabled');
							for (var i = 0; i < tab1.length; i++) {
								tab1[i].className = 'cbi-tab';
							}
							var tab2 = document.getElementsByClassName('cbi-tab');
							for (var i = 0; i < tab2.length; i++) {
								tab2[i].className = 'cbi-tab-disabled';
							}
							document.getElementById('sim-2').style.display = 'table';
							document.getElementById('sim-1').style.display = 'none';
						}
					}, _('SIM 2'))
				]) : ''
			]),
			E('table', {'class': 'table cbi-section-table', 'id': 'sim-1'}, [
				E('tr', {'class': 'tr table-title', 'style': 'display: none;'}),
				E('tr', {'class': 'tr cbi-rowstyle-1'}, [
					E('td', {'class': 'td left', 'width': '50%'}, _('Operator name')),
					E('td', {'class': 'td'}, Array.isArray(data.operator) ? data.operator[0] : (data.operator || '-'))
				]),
				E('tr', {'class': 'tr cbi-rowstyle-2'}, [
					E('td', {'class': 'td left', 'width': '50%'}, _('Network type')),
					E('td', {'class': 'td'}, Array.isArray(data.network) ? data.network[0] : (data.network || '-'))
				]),
				E('tr', {'class': 'tr cbi-rowstyle-1'}, [
					E('td', {'class': 'td left', 'width': '50%'}, _('Roaming mode')),
					E('td', {'class': 'td'},
					(data.roaming && data.roaming[0] === 'true') ? _('On') : (
						(data.roaming && data.roaming[0] === 'false') ? _('Off') : '-'))
				]),
				E('tr', {'class': 'tr cbi-rowstyle-2'}, [
					E('td', {'class': 'td left', 'width': '50%'}, _('Mobile Country Code (MCC)')),
					E('td', {'class': 'td'}, Array.isArray(data.mcc) ? data.mcc[0] : (data.mcc || '-'))
				]),
				E('tr', {'class': 'tr cbi-rowstyle-1'}, [
					E('td', {'class': 'td left', 'width': '50%'}, _('Driver')),
					E('td', {'class': 'td'}, data.driver || '-'),
				])
			]),
			E('table', {'class': 'table cbi-section-table', 'id': 'sim-2', 'style': 'display: none;'}, [
				E('tr', {'class': 'tr table-title', 'style': 'display: none;'}),
				E('tr', {'class': 'tr cbi-rowstyle-1'}, [
					E('td', {'class': 'td left', 'width': '50%'}, _('Operator name')),
					E('td', {'class': 'td'}, Array.isArray(data.operator) ? data.operator[1] : (data.operator || '-'))
				]),
				E('tr', {'class': 'tr cbi-rowstyle-2'}, [
					E('td', {'class': 'td left', 'width': '50%'}, _('Network type')),
					E('td', {'class': 'td'}, Array.isArray(data.network) ? data.network[1] : (data.network || '-'))
				]),
				E('tr', {'class': 'tr cbi-rowstyle-1'}, [
					E('td', {'class': 'td left', 'width': '50%'}, _('Roaming mode')),
					E('td', {'class': 'td'},
					(data.roaming && data.roaming[0] === 'true') ? _('On') : (
						(data.roaming && data.roaming[0] === 'false') ? _('Off') : '-'))
				]),
				E('tr', {'class': 'tr cbi-rowstyle-2'}, [
					E('td', {'class': 'td left', 'width': '50%'}, _('Mobile Country Code (MCC)')),
					E('td', {'class': 'td'}, Array.isArray(data.mcc) ? data.mcc[1] : (data.mcc || '-'))
				]),
				E('tr', {'class': 'tr cbi-rowstyle-1'}, [
					E('td', {'class': 'td left', 'width': '50%'}, _('Driver')),
					E('td', {'class': 'td'}, data.driver || '-'),
				])
			])
		];
		return E('div', {'class': 'cbi-map'}, [
			E(header),
			E('div', {'class': 'cbi-section'}, network),
			E('div', {'class': 'cbi-section'}, cell)
		])
	}
})
