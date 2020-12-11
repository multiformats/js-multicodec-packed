'use strict'

const fs = require('fs')
const path = require('path')
const http = require('ipfs-utils/src/http')
const url = 'https://raw.githubusercontent.com/multiformats/multicodec/master/table.csv'

const run = async () => {
  const rsp = await http.get(url)
  const lines = (await rsp.text()).split('\n')
  const names = []
  const codes = []
  const processed = lines
    .slice(1, lines.length - 1)
    .map(l => {
      const [name, tag, code] = l.split(',')
      return [name.trim(), tag.trim(), code.trim()]
    })
    .reduce((acc, l, index, arr) => {
      names.push(`'${l[0]}'`)
      codes.push(`${l[2].replace('\'', '')}`)
      acc += `  '${l[0]}': ${l[2].replace('\'', '')}`

      if (index !== arr.length - 1) {
        acc += ',\n'
      }
      return acc
    }, '')

  const typesTemplate = `/**
 * Constant names for all available codecs
 */
export type CodecConstant = ${names.map(n => `${n.toUpperCase().replace(/-/g, '_')}`).join(' | ')};

/**
 * Names for all available codecs
 */
export type CodecName = ${names.join(' | ')};

/**
 * Number for all available codecs
 */
export type CodecNumber = ${codes.join(' | ')};

export type ConstantNumberMap = Record<CodecConstant, CodecNumber>
export type NameUint8ArrayMap = Record<CodecName, Uint8Array>
export type NumberNameMap = Record<CodecNumber, CodecName>
export type NameNumberMap = Record<CodecName, CodecNumber>
`

  const tableTemplate = `/* eslint quote-props: off */
'use strict'

/**
 * @type {import('./types').NameNumberMap}
 */
const baseTable = Object.freeze({
${processed}
})

module.exports = { baseTable }
`

  fs.writeFileSync(path.join(__dirname, '../src/types.ts'), typesTemplate)
  fs.writeFileSync(path.join(__dirname, '../src/base-table.js'), tableTemplate)
}

run()
