const fs = require('fs')
const path = require('path')
const walk = require('walk')
const { debuger } = require('touno.io')
const mediainfo = require('@touno-io/mediainfo')
const cli = require('cli-progress')
const fx = require('mkdir-recursive')

// const EventEmitter = require('events')
// const myEmitter = new EventEmitter()
// myEmitter.on('event', () => {
//   console.log('an event occurred!')
// })
// myEmitter.emit('event')
const fsJSONWrite = (root, folder, filename, data) => {
  let fullPath = path.join(root, folder)
  fx.mkdirSync(fullPath)
  return new Promise((resolve, reject) => {
    let target = `${fullPath}\\${filename}.json`
    if (fs.existsSync(target)) target = `${fullPath}\\${filename}_${+new Date()}.json`

    fs.writeFile(target, JSON.stringify(data), { encoding: 'utf-8' }, err => {
      if (err) reject(err); else resolve(target)
    })
  })
}

const toSize = (bytes) => {
  let i = 0
  let aUnit = [ 'B', 'KB', 'MB', 'GB', 'TB' ]
  while (bytes / 1024 > 1 && i < 4) {
    bytes = bytes / 1024
    i++
  }
  return `${Math.round(bytes * 100) / 100} ${aUnit[i]}`
}

const writeline = (args) => {
  process.stdout.write(args)
  process.stdout.cursorTo(0)
}

const directorys = async (root) => {
  debuger.start(`Directories listen... '${root}'`)
  const walker = walk.walk(root)
  return new Promise((resolve, reject) => {
    let files = []
    let totalFile = 0
    let totalSize = 0
    walker.on('file', (dir, fileStats, next) => {
      totalFile++
      totalSize += fileStats.size
      writeline(`${totalFile} Initialize...`)
      files.push({
        full: path.join(dir, fileStats.name),
        folder: dir.replace(root, ''),
        name: fileStats.name,
        size: fileStats.size,
        ctime: fileStats.atime,
        mtime: fileStats.ctime
      })
      next()
    })

    walker.on('errors', (root, nodeStatsArray, next) => {
      next()
    })

    walker.on('end', () => {
      debuger.success(`Directories completed.`)
      resolve({
        total: files.length,
        size: totalSize,
        list: files
      })
    })
  })
}
// mediainfo('foo/bar.mkv', 'foo/bar2.avi').then(function(data) {
//   for (var i in data) {
//     console.log('%s parsed', data[i].file)
//     console.log('MediaInfo data:', data[i])
//   }
// }).catch(function (e){console.error(e)})

const bar1 = new cli.Bar({}, cli.Presets.shades_grey)
directorys('F:/Anime').then(async files => {
  debuger.info(`Total size: ${toSize(files.size)}`)
  bar1.start(files.total, 0)
  for (let i = 0; i < files.list.length; i++) {
    const file = files.list[i]
    let info = await mediainfo(file.full)
    await fsJSONWrite('F:/Anime-Storage/', file.folder, file.name, info)
    bar1.update(i)
  }
}).then(() => {
  bar1.stop()
  process.exit(0)
}).catch(debuger.error)
