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
				{device},
				fs.exec('adb', ['-s', device, 'shell', 'df', 'sdcard', '-h']).then(function(result) {
					var sdcard = {};
					var stderr = result.stderr;
					var stdout = result.stdout;
					var properties = {
						'Size': 'size',
						'Used': 'use',
						'Avail': 'free',
						'Use%': 'percentage',
						'Mounted': 'mounted'
					};
					if (stderr) {
						sdcard['sdcard'] = stderr.trim();
						return sdcard;
					} else {
						var value = [];
						var lines = stdout.split('\n');
						var header = lines[0].split(/\s+/);
						var data = lines[1].split(/\s+/);
						for (var i = 0; i < header.length; i++) {
							var property = properties[header[i]];
							if (property) {
								value[property] = data[i];
							}
						}
						sdcard['sdcard'] = value;
						return sdcard
					}
				}).catch(function(error) {
					return {error};
				}),
				fs.exec('adb', ['-s', device, 'shell', 'pm', 'list', 'packages']).then(function(result) {
					var packages = {};
					var stderr = result.stderr;
					var stdout = result.stdout;
					if (stderr) {
						packages['packages'] = stderr.trim();
						return packages;
					} else {
						var parts = stdout.trim().split('\n').map(function(line) {
							return line.replace('package:', '');
						});
						packages['packages'] = parts;
						return packages
					}
				}).catch(function(error) {
					return {error};
				}),
			]).then(function(results) {
				var device = results[0];
				var sdcard = results[1];
				var packages = results[2];
				var mergedInfo = Object.assign({}, device, sdcard, packages);
				return mergedInfo;
			}).catch(function(error) {
				return {error};
			});
		});
	},
	render: function(data) {
		console.log(data);
		var header = [
			E('h2', {'class': 'section-title'}, _('DroidNet')),
			E('div', {'class': 'cbi-map-descr'}, _('Manage Android modem and optimize network settings.'))
		];
		if (!data.sdcard.includes('error: device not found')) {
			var log = '/var/log/droidnet.log';
			var date = new Date().toLocaleDateString(undefined, {
				weekday: 'short',
				month: 'short',
				day: '2-digit'
			});
			var time = new Date().toLocaleTimeString(undefined, {
				hour: '2-digit',
				minute: '2-digit'
			});
			var control = [
				E('h3', {'class': 'section-title'}, _('Power control')),
				E('div', {'class': 'cbi-section-descr'}, _('Effortlessly control your device power settings with the ability to shutdown, restart, and access Fastboot and Recovery modes, all in one place.')),
				E('table', {'class': 'table cbi-section-table'}, [
					E('tr', {'class': 'tr'}, [
						E('td', {'class': 'td center', 'style': 'border: none;'}, [
							E('button', {
								'class': 'btn cbi-button cbi-button-save',
								'click': function() {
									ui.showModal(_('Fastboot mode'), [
										E('p', _('Are you sure you want rebooting device to Fastboot mode?')),
										E('div', {'class': 'right'}, [
											E('button', {
												'class': 'btn cbi-button cbi-button-cancel',
												'style': 'margin-right: 10px',
												'click': ui.hideModal
											}, _('Cancel')),
											E('button', {
												'class': 'btn cbi-button cbi-button-remove',
												'click': function() {
													fs.exec('adb', ['-s', data.device, 'shell', 'reboot', 'bootloader']).then(function() {
														fs.read(log).then(function(result) {
															var message = _('Device entered Fastboot mode.');
															var notif = `${date}, ${time} - ${message}`;
															var newData = result.trim() + '\n' + notif + '\n';
															return fs.write(log, newData);
														});
													});
													ui.showModal(_('Rebooting to Fastboot mode'), [
														E('p', {'class': 'spinning'}, _('Waiting for device to reboot into Fastboot mode…'))
													]);
													setTimeout(function() {
														ui.showModal(_('Fastboot mode completed'), [
															E('p', _('The device has been successfully to Fastboot mode.')),
															E('div', {'class': 'right'}, [
																E('button', {
																	'class': 'btn',
																	'click': function() {
																		return window.location.reload();
																	}
																}, _('OK'))
															])
														]);
													}, 10000);
												}
											}, _('Reboot'))
										])
									]);
								}
							}, _('Fastboot mode'))
						]),
						E('td', {'class': 'td center', 'style': 'border: none;'}, [
							E('button', {
								'class': 'btn cbi-button cbi-button-save',
								'click': function() {
									ui.showModal(_('Recovery mode'), [
										E('p', _('Are you sure you want rebooting device to Recovery mode?')),
										E('div', {'class': 'right'}, [
											E('button', {
												'class': 'btn cbi-button cbi-button-cancel',
												'style': 'margin-right: 10px',
												'click': ui.hideModal
											}, _('Cancel')),
											E('button', {
												'class': 'btn cbi-button cbi-button-remove',
												'click': function() {
													fs.exec('adb', ['-s', data.device, 'shell', 'reboot', 'recovery']).then(function() {
														fs.read(log).then(function(result) {
															var message = _('Device entered Recovery mode.');
															var notif = `${date}, ${time} - ${message}`;
															var newData = result.trim() + '\n' + notif + '\n';
															return fs.write(log, newData);
														});
													});
													ui.showModal(_('Rebooting to Recovery mode'), [
														E('p', {'class': 'spinning'}, _('Waiting for device to reboot into Recovery mode…'))
													]);
													setTimeout(function() {
														ui.showModal(_('Recovery mode completed'), [
															E('p', _('The device has been successfully to Recovery mode.')),
															E('div', {'class': 'right'}, [
																E('button', {
																	'class': 'btn',
																	'click': function() {
																		return window.location.reload();
																	}
																}, _('OK'))
															])
														]);
													}, 10000);
												}
											}, _('Reboot'))
										])
									]);
								}
							}, _('Recovery mode'))
						]),
						E('td', {'class': 'td center', 'style': 'border: none;'}, [
							E('button', {
								'class': 'btn cbi-button cbi-button-remove',
								'click': function() {
									ui.showModal(_('Restart device'), [
										E('p', _('Are you sure you want to restart the device?')),
										E('div', {'class': 'right'}, [
											E('button', {
												'class': 'btn cbi-button cbi-button-cancel',
												'style': 'margin-right: 10px',
												'click': ui.hideModal
											}, _('Cancel')),
											E('button', {
												'class': 'btn cbi-button cbi-button-remove',
												'click': function() {
													fs.exec('adb', ['-s', data.device, 'shell', 'reboot']).then(function() {
														fs.read(log).then(function(result) {
															var message = _('Device restarted successfully.');
															var notif = `${date}, ${time} - ${message}`;
															var newData = result.trim() + '\n' + notif + '\n';
															return fs.write(log, newData);
														});
													});
													ui.showModal(_('Restarting device'), [
														E('p', {'class': 'spinning'}, _('Waiting for device restart to complete…'))
													]);
													setTimeout(function() {
														ui.showModal(_('Device restart completed'), [
															E('p', _('The device has been successfully restarted.')),
															E('div', {'class': 'right'}, [
																E('btn', {
																	'class': 'btn',
																	'click': function() {
																		return window.location.reload();
																	}
																}, _('OK'))
															])
														]);
													}, 30000);
												}
											}, _('Restart'))
										])
									]);
								}
							}, _('Restart'))
						]),
						E('td', {'class': 'td center', 'style': 'border: none;'}, [
							E('button', {
								'class': 'btn cbi-button cbi-button-remove',
								'click': function() {
									ui.showModal(_('Shutdown device'), [
										E('p', _('Are you sure you want to shut down the device?')),
										E('div', {'class': 'right'}, [
											E('button', {
												'class': 'btn cbi-button cbi-button-cancel',
												'style': 'margin-right: 10px',
												'click': ui.hideModal
											}, _('Cancel')),
											E('button', {
												'class': 'btn cbi-button cbi-button-remove',
												'click': function() {
													fs.exec('adb', ['-s', data.device, 'shell', 'reboot', '-p']).then(function() {
														fs.read(log).then(function(result) {
															var message = _('Device powered off successfully.');
															var notif = `${date}, ${time} - ${message}`;
															var newData = result.trim() + '\n' + notif + '\n';
															return fs.write(log, newData);
														});
													});
													ui.showModal(_('Shutting down device'), [
														E('p', {'class': 'spinning'}, _('Waiting for device to shut down…'))
													]);
													setTimeout(function() {
														ui.showModal(_('Device shutdown completed'), [
															E('p', _('The device has been successfully shut down.')),
															E('div', {'class': 'right'}, [
																E('button', {
																	'class': 'btn',
																	'click': function() {
																		return window.location.reload();
																	}
																}, _('OK'))
															])
														]);
													}, 15000);
												}
											}, _('Shutdown'))
										])
									]);
								}
							}, _('Shutdown'))
						])
					])
				])
			];
			var packages = data.packages;
			var itemsPerPage = 10;
			var currentPage = 1;
			var currentFilter = '';
			
			function renderTable(page) {
				var startIndex = (page - 1) * itemsPerPage;
				var filteredData = packages.filter(function(item) {
					return item.toLowerCase().includes(currentFilter.toLowerCase());
				});
				var endIndex = Math.min(startIndex + itemsPerPage, filteredData.length);
				var currentPageData = filteredData.slice(startIndex, endIndex);
				var tableRows = currentPageData.map(function(value, index) {
					var rowClass = index % 2 === 0 ? 'cbi-rowstyle-1' : 'cbi-rowstyle-2';
					return E('tr', {'class': 'tr ' + rowClass }, [
						E('td', {'class': 'td left'}, value),
						E('td', {'class': 'td right'}, [
							E('button', {
								'class': 'btn cbi-button cbi-button-remove',
								'click': function() {
									ui.showModal(_('Remove package') + ` ${value}`, [
										E('p', _('Are you sure you want to remove this package?')),
										E('div', {'class': 'right'}, [
											E('button', {
												'class': 'btn cbi-button cbi-button-cancel',
												'style': 'margin-right: 10px',
												'click': ui.hideModal
											}, _('Cancel')),
											E('button', {
												'class': 'btn cbi-button cbi-button-remove',
												'click': function() {
													ui.showModal(_('Removing package'), [
														E('p', {'class': 'spinning'}, _('Waiting for package removal to complete…'))
													]);
													fs.exec('adb', ['-s', data.device, 'shell', 'pm', 'uninstall', '-k', '--user', '0', value]).then(function(result) {
														var stdout = result.stdout;
														if (stdout.trim() === 'Success') {
															fs.read(log).then(function(result) {
																var message = _('Removing %s package successfully.').format(value);
																var notif = `${date}, ${time} - ${message}`;
																var newData = result.trim() + '\n' + notif + '\n';
																return fs.write(log, newData);
															});
															setTimeout(function() {
																ui.showModal(_('Removing package completed'), [
																	E('p', _('The package has been successfully removed.')),
																	E('div', {'class': 'right'}, [
																		E('btn', {
																			'class': 'btn',
																			'click': function() {
																				return window.location.reload();
																			}
																		}, _('OK'))
																	])
																]);
															}, 1000);
														} else {
															fs.read(log).then(function(result) {
																var message = _('Failed to remove the %s package.').format(value);
																var notif = `${date}, ${time} - ${message} : ${stdout}`;
																var newData = result.trim() + '\n' + notif + '\n';
																return fs.write(log, newData);
															});
															ui.showModal(_('Package removal failed'), [
																E('p', _('Failed to remove the package.')),
																E('em', {'style': 'color: red;'}, stdout),
																E('div', {'class': 'right'}, [
																	E('button', {
																		'class': 'btn',
																		'click': function() {
																			return window.location.reload();
																		}
																	}, _('OK'))
																])
															]);
														};
													});
												}
											}, _('Remove'))
										])
									]);
								}
							}, _('Remove'))
						])
					]);
				});
				return E('table', {'class': 'table cbi-section-table'}, [
					E('tr', {'class': 'tr table-titles'}, [
						E('th', {'class': 'th left'}, _('Package name')),
						E('th', {'class': 'th'})
					]),
					E(tableRows)
				]);
			}
			
			function updatePageInfo() {
				var filteredData = packages.filter(function(item) {
					return item.toLowerCase().includes(currentFilter.toLowerCase());
				});
				var totalItems = filteredData.length;
				var startIndex = (currentPage - 1) * itemsPerPage + 1;
				var endIndex = Math.min(startIndex + itemsPerPage - 1, totalItems);
				var pageInfoText = 'Displaying ' + startIndex + '-' + endIndex + ' of ' + totalItems;
				var pageInfo = document.getElementById('page-info');
				pageInfo.textContent = pageInfoText;
			}
			
			function updateTable() {
				var tableContainer = document.getElementById('table-container');
				tableContainer.innerHTML = '';
				var table = renderTable(currentPage);
				tableContainer.appendChild(table);
				updatePageInfo();
			}
			var uninstaller = [
				E('h3', {'class': 'section-title'}, _('Uninstaller')),
				E('div', {'class': 'cbi-section-descr'}, _('Effortlessly uninstall unwanted applications from your device with the Uninstaller service.')),
				E('div', {'class': 'controls', 'style': 'display: flex; flex-wrap: wrap; justify-content: space-between;'}, [
					E('div', {'class': 'disk-package', 'style': 'flex-basis: 100%; min-width: 250px; padding: .25em;'}, [
						E('label', _('Disk space') + ' : '),
						E('div', {'class': 'cbi-progressbar', 'title': _('%s used (%s used of %s, %s free)').format(data.sdcard.percentage, data.sdcard.use, data.sdcard.size, data.sdcard.free)}, [
							E('div', {'style': `width: ${data.sdcard.percentage};`}, '&nbsp;')
						])
					]),
					E('div', {'class': 'filter-package', 'style': 'flex-basis: 50%; padding: .25em;'}, [
						E('label', _('Filter') + ' : '),
						E('span', {'class': 'control-group', 'style': 'display: flex;'}, [
							E('input', {
								'type': 'text',
								'class': 'filter-input',
								'placeholder': 'Type to filter…',
								'keyup': function() {
									currentFilter = event.target.value;
									currentPage = 1; // Kembali ke halaman pertama setelah mengubah filter
									updateTable();
								}
							}),
							E('button', {
								'class': 'btn cbi-button',
								'click': function() {
									currentFilter = '';
									currentPage = 1;
									updateTable();
									var filterInput = document.querySelector('.filter-input');
									filterInput.value = '';
								}
							}, _('Clear'))
						])
					]),
					E('div', {'class': 'actions-package', 'style': 'flex-basis: 50%; padding: .25em;'}, [
						E('label', _('Actions') + ' : '),
						E('span', {'class': 'control-group', 'style': 'display: flex;'}, [
							E('button', {
								'class': 'btn cbi-button cbi-button-save',
								'click': function() {
									ui.showModal(_('Updating package list'), [
										E('p', {'class': 'spinning'}, _('Waiting for the update package list command to complete…'))
									]);
									setTimeout(function() {
										ui.showModal(_('Update package list completed'), [
											E('p', _('The package list has been successfully updated.')),
											E('div', {'class': 'right'}, [
												E('button', {
													'class': 'btn',
													'click': function() {
														return window.location.reload();
													}
												}, _('OK'))
											])
										]);
									}, 10000);
								}
							}, _('Update list')),
							E('button', {
								'class': 'btn cbi-button cbi-button-action',
								'click': function() {
									var path = '/tmp/upload.apk';
									ui.uploadFile(path).then(function() {
										ui.showModal(_('Installing package'), [
											E('p', {'class': 'spinning'}, _('Waiting for the package installation to complete…'))
										]);
										fs.exec_direct('adb', ['-s', data.device, 'install', path]).then(function(result) {
											var result_apk = result.trim();
											if (result_apk === 'Success') {
												fs.read(log).then(function(result) {
													var message = _('The package has been successfully installed.');
													var notif = `${date}, ${time} - ${message}`;
													var newData = result.trim() + '\n' + notif + '\n';
													return fs.write(log, newData);
												});
												ui.showModal(_('Package installation completed'), [
													E('p', _('The package has been successfully installed.')),
													E('div', {'class': 'right'}, [
														E('button', {
															'class': 'btn',
															'click': function() {
																return window.location.reload();
															}
														}, _('OK'))
													])
												]);
											} else {
												fs.read(log).then(function(result) {
													var message = _('Failed to install the package');
													var notif = `${date}, ${time} - ${message} : ${result_apk}`;
													var newData = result.trim() + '\n' + notif + '\n';
													return fs.write(log, newData);
												});
												ui.showModal(_('Package installation failed'), [
													E('p', _('Failed to install the package.')),
													E('em', {'style': 'color: red;'}, result_apk),
													E('div', {'class': 'right'}, [
														E('button', {
															'class': 'btn',
															'click': function() {
																return window.location.reload();
															}
														}, _('OK'))
													])
												]);
											};
											fs.remove(path);
										});
									}).catch(function(error) {
										if (error.message === 'Upload has been cancelled') {
											ui.hideModal();
										} else {
											fs.read(log).then(function(result) {
												var message = _('Failed to upload the package.');
												var notif = `${date}, ${time} - ${message} : ${error}`;
												var newData = result.trim() + '\n' + notif + '\n';
												return fs.write(log, newData);
											});
											ui.showModal(_('Error uploading file'), [
												E('p', _('Failed to upload the file.')),
												E('em', {'style': 'color: red;'}, error),
												E('div', {'class': 'right'}, [
													E('button', {
														'class': 'btn',
														'click': function() {
															return window.location.reload();
														}
													}, _('OK'))
												])
											]);
										};
									});
								}
							}, _('Upload package'))
						])
					])
				]),
				E('div', {'class': 'controls', 'style': 'display: flex; flex-wrap: wrap; justify-content: space-around; padding: 1em 0;'}, [
					E('button', {
						'class': 'btn cbi-button-neutral prev',
						'style': 'flex-basis: 20%; text-align: center;',
						'click': function() {
							if (currentPage > 1) {
								currentPage--;
								updateTable();
							}
						}
					}, '«'),
					E('div', {'class': 'text', 'id': 'page-info', 'style': 'flex-grow: 1; align-self: center; text-align: center;'}, 'Displaying 1-' + itemsPerPage + ' of ' + packages.length),
					E('button', {
						'class': 'btn cbi-button-neutral next',
						'style': 'flex-basis: 20%; text-align: center;',
						'click': function() {
							var filteredData = packages.filter(function(item) {
								return item.toLowerCase().includes(currentFilter.toLowerCase());
							});
							if (currentPage < Math.ceil(filteredData.length / itemsPerPage)) {
								currentPage++;
								updateTable();
							}
						}
					}, '»')
				]),
				E('div', { 'id': 'table-container' }, renderTable(currentPage))
			];
		} else {
			ui.addNotification(_('Error: Device conflict!'),
				E('p', _('Please check your settings. The configured device and ADB devices are conflicting.')), 'danger');
			return E('div', {'class': 'cbi-map'}, [
				E(header),
				E('div', {'class': 'cbi-section'}, [
					E('div', {'class': 'cbi-value center'}, [
						E('em', _('No device detected or connected.'))
					])
				]),
			]);
		}
		return E('div', {'class': 'cbi-map'}, [
			E(header),
			E('div', {'class': 'cbi-section'}, control),
			E('div', {'class': 'cbi-section'}, uninstaller)
		])
	}
})
