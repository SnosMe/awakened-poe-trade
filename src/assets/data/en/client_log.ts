const dict = {
  'channel.system': /^: (?<body>.+)$/,
  'channel.trade': /^\$(?:<(?<guild_tag>.+?)> )?(?<char_name>.+?): (?<body>.+)$/,
  'channel.global': /^#(?:<(?<guild_tag>.+?)> )?(?<char_name>.+?): (?<body>.+)$/,
  'channel.party': /^%(?:<(?<guild_tag>.+?)> )?(?<char_name>.+?): (?<body>.+)$/,
  'channel.guild': /^&(?:<(?<guild_tag>.+?)> )?(?<char_name>.+?): (?<body>.+)$/,
  'channel.whisper.to': /^@To (?<char_name>.+?): (?<body>.+)$/,
  'channel.whisper.from': /^@From (?:<(?<guild_tag>.+?)> )?(?<char_name>.+?): (?<body>.+)$/,
  'trade.gem': /^level (?<gem_lvl>\d+) (?<gem_qual>\d+)% (?<gem_name>.+)$/
}

export default dict

export type ClientLogDict = typeof dict
