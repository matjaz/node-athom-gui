'use strict'
const {dialog} = require('electron');

const path 			= require('path')
const os 			= require('os')
const ChildProcess 	= require('child_process')

const app 			= require('electron').app
const autoUpdater 	= require('electron').autoUpdater
const Menu 			= require('electron').Menu

var state = 'no-update'

exports.initialize = function() {
	const platform = os.platform() + '_' + os.arch()
	const version = app.getVersion()

	autoUpdater.on('checking-for-update', function() {
		dialog.showErrorBox('checking', JSON.stringify(arguments))
		state = 'checking'
		exports.updateMenu()
	})

	autoUpdater.on('update-available', function() {
		dialog.showErrorBox('available', JSON.stringify(arguments))
		state = 'checking'
		exports.updateMenu()
	})

	autoUpdater.on('update-downloaded', function() {
		dialog.showErrorBox('downloaded', JSON.stringify(arguments))
		state = 'installed'
		exports.updateMenu()
	})

	autoUpdater.on('update-not-available', function() {
		dialog.showErrorBox('not available', JSON.stringify(arguments))
		state = 'no-update'
		exports.updateMenu()
	})

	autoUpdater.on('error', function() {
		dialog.showErrorBox('error', JSON.stringify(arguments))
		state = 'no-update'
		exports.updateMenu()
	})

	autoUpdater.setFeedURL(`https://nuts.athom.com/update/${platform}/${version}`)

	autoUpdater.checkForUpdates()
}

exports.updateMenu = function() {
	var menu = Menu.getApplicationMenu()
	if (!menu) return

	menu.items.forEach(function(item) {
		if (item.submenu) {
			item.submenu.items.forEach(function(item) {
				switch (item.key) {
					case 'checkForUpdate':
						item.visible = state === 'no-update'
						break
					case 'checkingForUpdate':
						item.visible = state === 'checking'
						break
					case 'restartToUpdate':
						item.visible = state === 'installed'
						break
				}
			})
		}
	})
}

exports.createShortcut = function(callback) {
	spawnUpdate([
		'--createShortcut',
		path.basename(process.execPath),
		'--shortcut-locations',
		'StartMenu'
	], callback)
}

exports.removeShortcut = function(callback) {
	spawnUpdate([
		'--removeShortcut',
		path.basename(process.execPath)
	], callback)
}

function spawnUpdate(args, callback) {
	var updateExe = path.resolve(path.dirname(process.execPath), '..', 'Update.exe')
	var stdout = ''
	var spawned = null

	try {
		spawned = ChildProcess.spawn(updateExe, args)
	} catch (error) {
		if (error && error.stdout == null) error.stdout = stdout
		process.nextTick(function() {
			callback(error)
		})
		return
	}

	var error = null

	spawned.stdout.on('data', function(data) {
		stdout += data
	})

	spawned.on('error', function(processError) {
		if (!error) error = processError
	})

	spawned.on('close', function(code, signal) {
		if (!error && code !== 0) {
			error = new Error('Command failed: ' + code + ' ' + signal)
		}
		if (error && error.code == null) error.code = code
		if (error && error.stdout == null) error.stdout = stdout
		callback(error)
	})
}