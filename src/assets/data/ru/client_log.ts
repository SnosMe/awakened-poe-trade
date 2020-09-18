import type { ClientLogDict } from '../en/client_log'

const dict: ClientLogDict = {
  'channel.system': /^: (?<body>.+)$/,
  'channel.trade': /^\$(?:<(?<guild_tag>.+?)> )?(?<char_name>.+?): (?<body>.+)$/,
  'channel.global': /^#(?:<(?<guild_tag>.+?)> )?(?<char_name>.+?): (?<body>.+)$/,
  'channel.party': /^%(?:<(?<guild_tag>.+?)> )?(?<char_name>.+?): (?<body>.+)$/,
  'channel.guild': /^&(?:<(?<guild_tag>.+?)> )?(?<char_name>.+?): (?<body>.+)$/,
  'channel.whisper.to': /^@Кому (?<char_name>.+?): (?<body>.+)$/,
  'channel.whisper.from': /^@От кого (?:<(?<guild_tag>.+?)> )?(?<char_name>.+?): (?<body>.+)$/,
  'trade.gem': /^уровень (?<gem_lvl>\d+) (?<gem_qual>\d+)% (?<gem_name>.+)$/
}

export default dict
