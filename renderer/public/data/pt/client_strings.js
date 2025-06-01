// @ts-check
/** @type{import('../../../src/assets/data/interfaces').TranslationDict} */
export default {
  // ItemDisplayStringNormal 
  RARITY_NORMAL: 'Normal',
  // ItemDisplayStringMagic
  RARITY_MAGIC: 'Mágico',
  // ItemDisplayStringRare
  RARITY_RARE: 'Raro',
  // ItemDisplayStringUnique
  RARITY_UNIQUE: 'Único',
  // ItemDisplayStringGem
  RARITY_GEM: 'Gema',
  // ItemDisplayStringCurrency
  RARITY_CURRENCY: 'Moeda',
  // ItemDisplayStringDivinationCard
  RARITY_DIVCARD: 'Carta de Adivinhação',
  // ItemDisplayStringQuest
  RARITY_QUEST: 'Missão',
  // UIOptionsSectionTitleMap + Tier
  MAP_TIER: 'Mapa Tier: ',
  // ItemDisplayStringRarity
  RARITY: 'Raridade: ',
  // ItemDisplayStringClass
  ITEM_CLASS: 'Classe do Item: ',
  // ItemDisplayStringItemLevel
  ITEM_LEVEL: 'Nível do Item: ',
  // CorpseSuffix + Level
  CORPSE_LEVEL: 'Cadáver Nível: ',
  // ItemDisplayStringTalismanTier
  TALISMAN_TIER: 'Tier do Talismã: ',
  // SkillGemCraftingLevel
  GEM_LEVEL: 'Nível: ',
  // ItemDisplayStackSize
  STACK_SIZE: 'Tamanho da Pilha: ',
  // ItemDisplayStringSockets
  SOCKETS: 'Encaixes: ',
  // Quality
  QUALITY: 'Qualidade: ',
  // ItemDisplayWeaponPhysicalDamage
  PHYSICAL_DAMAGE: 'Dano Físico: ',
  // ItemDisplayWeaponElementalDamage
  ELEMENTAL_DAMAGE: 'Dano Elemental: ',
  // ItemDisplayWeaponLightningDamage
  LIGHTNING_DAMAGE: 'Dano de Raio: ',
  // ItemDisplayWeaponColdDamage
  COLD_DAMAGE: 'Dano de Gelo: ',
  // ItemDisplayWeaponFireDamage
  FIRE_DAMAGE: 'Dano de Fogo: ',
  // ItemDisplayWeaponCriticalStrikeChance
  CRIT_CHANCE: 'Chance de Acerto Crítico: ',
  // ItemDisplayWeaponAttacksPerSecond
  ATTACK_SPEED: 'Ataques por Segundo: ',
  // ItemDisplayArmourArmour
  ARMOUR: 'Armadura: ',
  // ItemDisplayArmourEvasionRating
  EVASION: 'Evasão: ',
  // ItemDisplayArmourEnergyShield
  ENERGY_SHIELD: 'Escudo de Energia: ',
  // ItemDisplayShieldBlockChance
  BLOCK_CHANCE: 'Chance de Bloqueio: ',
  // ItemPopupCorrupted
  CORRUPTED: 'Corrompido',
  // ItemPopupUnidentified
  UNIDENTIFIED: 'Não Identificado',
  // QualityItem
  ITEM_SUPERIOR: /^(.*)$ Superior/,
  // InfectedMap
  MAP_BLIGHTED: /^(.*)$ Infestado/,
  // UberInfectedMap
  MAP_BLIGHT_RAVAGED: /^(.*)$ Devastado/,
  // ItemPopupShaperItem
  INFLUENCE_SHAPER: 'Item do Criador',
  // ItemPopupElderItem
  INFLUENCE_ELDER: 'Item do Ancião',
  // ItemPopupCrusaderItem
  INFLUENCE_CRUSADER: 'Item do Cruzado',
  // ItemPopupHunterItem
  INFLUENCE_HUNTER: 'Item do Caçador',
  // ItemPopupRedeemerItem
  INFLUENCE_REDEEMER: 'Item do Redentor',
  // ItemPopupWarlordItem
  INFLUENCE_WARLORD: 'Item do Senhor da Guerra',
  // ItemPopupSynthesisedItem
  SECTION_SYNTHESISED: 'Item Sintetizado',
  // SynthesisedItem
  ITEM_SYNTHESISED: /^(.*)$ Sintetizado/,
  // ItemDisplayVeiledPrefix
  VEILED_PREFIX: 'Prefixo Oculto',
  // ItemDisplayVeiledSuffix
  VEILED_SUFFIX: 'Sufixo Oculto',
  // ItemDisplayChargesNCharges
  FLASK_CHARGES: /^Atualmente tem \d+ Cargas$/,
  // MetamorphosisItemisedMapBoss
  METAMORPH_HELP: "Combine este com quatro outras amostras diferentes no Laboratório de Tane.",
  // ItemDescriptionItemisedCapturedMonster
  BEAST_HELP: 'Clique com o botão direito para adicionar isto ao seu bestiário.',
  // PrimordialWatchstoneDescriptionText
  VOIDSTONE_HELP: 'Encaixe isso no seu Atlas para aumentar o Tier de todos os Mapas.',
  METAMORPH_BRAIN: /^.* Brain$/,
  METAMORPH_EYE: /^.* Eye$/,
  METAMORPH_LUNG: /^.* Lung$/,
  METAMORPH_HEART: /^.* Heart$/,
  METAMORPH_LIVER: /^.* Liver$/,
  // ItemPopupCannotUseItem
  CANNOT_USE_ITEM: 'Você não pode utilizar este item. Suas propriedades serão ignoradas',
  // GemAlternateQuality1Affix
  QUALITY_ANOMALOUS: /^Anômalo (.*)$/,
  // GemAlternateQuality2Affix
  QUALITY_DIVERGENT: /^Divergente (.*)$/,
  // GemAlternateQuality3Affix
  QUALITY_PHANTASMAL: /^Fantasmal (.*)$/,
  // ItemDisplayHeistContractLevel
  AREA_LEVEL: 'Nível da Área: ',
  // ItemDisplayHeistBlueprintWings
  HEIST_WINGS_REVEALED: 'Alas Reveladas: ',
  // ItemDisplayHeistContractObjective
  HEIST_TARGET: 'Alvo do Golpe: ',
  // HeistBlueprintRewardBunker
  HEIST_BLUEPRINT_ENCHANTS: 'Armamentos Encantados',
  // HeistBlueprintRewardMines
  HEIST_BLUEPRINT_TRINKETS: 'Adornos de Ladrão ou Itens Monetários',
  // HeistBlueprintRewardReliquary
  HEIST_BLUEPRINT_GEMS: 'Gemas Diferentes',
  // HeistBlueprintRewardLibrary
  HEIST_BLUEPRINT_REPLICAS: 'Réplicas ou Itens Experimentais',
  // ItemPopupMirrored
  MIRRORED: 'Espelhado',
  // ModDescriptionLineTier ModDescriptionLineRank ModDescriptionLineLevel
  MODIFIER_LINE: /^(?<type>[^"]+)(?:\s+"(?<name>[^"]+)")?(?:\s*\(Tier: (?<tier>\d+)\))?(?:\s*\(Rank: (?<rank>\d+)\))?$/,
  // ModDescriptionLinePrefix
  PREFIX_MODIFIER: 'Mod Prefixo',
  // ModDescriptionLineSuffix
  SUFFIX_MODIFIER: 'Mod Sufixo',
  // ModDescriptionLineCraftedPrefix
  CRAFTED_PREFIX: 'Mod Prefixo Criado por Mestre',
  // ModDescriptionLineCraftedSuffix
  CRAFTED_SUFFIX: 'Mod Sufixo Criado por Mestre',
  // DescriptionLabelFixedValueStat
  UNSCALABLE_VALUE: ' — Valor não escalável',
  // ModDescriptionLineCorruptedImplicit
  CORRUPTED_IMPLICIT: 'Mod Implícito Corrompido',
  // AlternateQualityModIncreaseText
  MODIFIER_INCREASED: /^(.+?)% Aumentado$/,
  // ItemDescriptionIncursionAccessibleRooms
  INCURSION_OPEN: 'Salas Abertas:',
  // ItemDescriptionIncursionInaccessibleRooms
  INCURSION_OBSTRUCTED: 'Salas Obstruídas:',
  // ModDescriptionLineGreatTangleImplicit
  EATER_IMPLICIT: /^Modificador Implícito do Devorador de Mundos \((?<rank>.+)\)$/,
  // ModDescriptionLineCleansingFireImplicit
  EXARCH_IMPLICIT: /^Modificador Implícito do Exarca Cauterizado \((?<rank>.+)\)$/,
  // EldritchCurrencyTier1
  ELDRITCH_MOD_R1: 'Menor',
  // EldritchCurrencyTier2
  ELDRITCH_MOD_R2: 'Maior',
  // EldritchCurrencyTier3
  ELDRITCH_MOD_R3: 'Distinto',
  // EldritchCurrencyTier4
  ELDRITCH_MOD_R4: 'Excepcional',
  // EldritchCurrencyTier5
  ELDRITCH_MOD_R5: 'Requintado',
  // EldritchCurrencyTier6
  ELDRITCH_MOD_R6: 'Perfeito',
  // ItemDisplaySentinelDroneDurability
  SENTINEL_CHARGE: 'Carga: ',
  SHAPER_MODS: ['of Shaping', "The Shaper's"],
  ELDER_MODS: ['of the Elder', "The Elder's"],
  CRUSADER_MODS: ["Crusader's", 'of the Crusade'],
  HUNTER_MODS: ["Hunter's", 'of the Hunt'],
  REDEEMER_MODS: ['of Redemption', "Redeemer's"],
  WARLORD_MODS: ["Warlord's", 'of the Conquest'],
  DELVE_MODS: ['Subterranean', 'of the Underground'],
  VEILED_MODS: ['Chosen', 'of the Order'],
  INCURSION_MODS: ["Guatelitzi's", "Xopec's", "Topotante's", "Tacati's", "Matatl's", 'of Matatl', "Citaqualotl's", 'of Citaqualotl', 'of Tacati', 'of Guatelitzi', 'of Puhuarte'],
  // ItemPopupFoilUniqueVariant
  FOIL_UNIQUE: 'Único Laminado',
  // ItemPopupUnmodifiable
  UNMODIFIABLE: 'Não Modificável',
  // ---
  CHAT_SYSTEM: /^: (?<body>.+)$/,
  CHAT_TRADE: /^\$(?:<(?<guild_tag>.+?)> )?(?<char_name>.+?): (?<body>.+)$/,
  CHAT_GLOBAL: /^#(?:<(?<guild_tag>.+?)> )?(?<char_name>.+?): (?<body>.+)$/,
  CHAT_PARTY: /^%(?:<(?<guild_tag>.+?)> )?(?<char_name>.+?): (?<body>.+)$/,
  CHAT_GUILD: /^&(?:<(?<guild_tag>.+?)> )?(?<char_name>.+?): (?<body>.+)$/,
  CHAT_WHISPER_TO: /^@To (?<char_name>.+?): (?<body>.+)$/,
  CHAT_WHISPER_FROM: /^@From (?:<(?<guild_tag>.+?)> )?(?<char_name>.+?): (?<body>.+)$/,
  CHAT_WEBTRADE_GEM: /^level (?<gem_lvl>\d+) (?<gem_qual>\d+)% (?<gem_name>.+)$/,
  // ItemPopupRequirements
  REQUIREMENTS: 'Requisitos',
  // ItemDisplayBeltCharmSlots
  CHARM_SLOTS: 'Espaço de Patuás:',
  // ItemDisplaySpiritValue
  BASE_SPIRIT: 'Espírito:',
  // ItemDescriptionQuiver
  QUIVER_HELP_TEXT: 'Só pode ser equipado se você estiver usando um Arco',
  // ItemDescriptionFlask
  FLASK_HELP_TEXT: 'Clique com o botão direito para beber.',
  // ItemDescriptionFlaskUtility1
  CHARM_HELP_TEXT: 'Usado automaticamente quando a condição é',
  // ItemDisplayStringNote
  PRICE_NOTE: 'Nota: ',
  // ItemDisplayMapTier
  WAYSTONE_TIER: 'Tier da Pedra Guia: ',
  // ItemDescriptionMap
  WAYSTONE_HELP: 'Pode ser usado em um Dispositivo de Mapa,',
  // ItemDescriptionPassiveJewel
  JEWEL_HELP: 'Coloque-a em um Encaixe',
  // ItemDescriptionSanctumRelic
  SANCTUM_HELP: 'Coloque este item no Altar de Relíquias',
  // JewelRadiusLabel
  TIMELESS_RADIUS: 'Raio: ',
  // ItemDescriptionPrecursorTablet
  PRECURSOR_TABLET_HELP: 'Pode ser usado em uma Torre concluída no seu Atlas para influenciar os Mapas ao redor',
  // ItemDescriptionExpeditionLogbook
  LOGBOOK_HELP: 'Leve este item até Dannig',
  // HeistRequiresText?
  REQUIRES: 'Requer',
  // ModStatJewelAddToSmall
  TIMELESS_SMALL_PASSIVES: 'Habilidades Passivas Pequenas no Raio também concedem {0}',
  // ModStatJewelAddToNotable
  TIMELESS_NOTABLE_PASSIVES: 'Habilidades Passivas Notáveis no Raio também concedem {0}',
  // ItemDisplayGrantsSkill
  GRANTS_SKILL: 'Concede Habilidade'
}
