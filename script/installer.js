#!/usr/bin/env node

const createWindowsInstaller = require('electron-winstaller').createWindowsInstaller
const createDMG = require('electron-installer-dmg')
const path = require('path')
const rimraf = require('rimraf')

const rootPath = path.join(__dirname, '..')
const outPath = path.join(rootPath, 'out');

deleteOutputFolder()
	.then(createOSXInstaller)
	.then(getInstallerConfig)
	.then(createWindowsInstaller)
	.catch((error) => {
		console.error(error.message || error)
		process.exit(1)
	})

function getInstallerConfig() {
	const iconPath = path.join(rootPath, 'assets', 'app-icon', 'win', 'app.ico')
	console.log('Building windows installer...')
	return Promise.resolve({
		exe				: 'Homey.exe',
		arch			: 'ia32',
		appDirectory	: path.join(outPath, 'Homey-win32-ia32'),
		iconUrl			: `file://${iconPath}`,
		loadingGif		: path.join(rootPath, 'assets', 'img', 'loading.gif'),
		noMsi 			: true,
		outputDirectory	: path.join(outPath, 'windows-installer'),
		setupExe		: 'HomeySetup.exe',
		setupIcon		: iconPath,
		skipUpdateIcon	: true
	})
}

function createOSXInstaller() {
	return new Promise((resolve, reject) => {
		const appPath = path.join(outPath, 'Homey-darwin-x64', 'Homey.app')
		const opts = {
			appPath		: appPath,
			name		: 'Homey',
			out			: outPath,
			'icon-size'	: 70,
			icon		: path.join(rootPath, 'assets', 'app-icon', 'mac', 'app.icns'),
			background	: path.join(rootPath, 'assets', 'img', 'background.png'),
			overwrite	: true,
			contents	: [
				{
					x: 350,
					y: 140,
					type: 'link',
					path: '/Applications'
				},
				{
					x: 150,
					y: 140,
					type: 'file',
					path: appPath
				}
			]
		}
		console.log('Building OSX installer...')
		createDMG(opts, (error) => {
			error ? reject(error) : resolve()
		})
	})
}

function deleteOutputFolder() {
	return new Promise((resolve, reject) => {
		rimraf(path.join(__dirname, '..', 'out', 'windows-installer'), (error) => {
			error ? reject(error) : resolve()
		})
	})
}