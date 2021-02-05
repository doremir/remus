export default {
  noteValues: {
    '1': { notehead: 'noteheadWhole', noteValue: 'w', flags: 0, dots: 0 },

    '1/2': { notehead: 'noteheadHalf', noteValue: 'h', flags: 0, dots: 0 },
    '3/4': { notehead: 'noteheadHalf', noteValue: 'h', flags: 0, dots: 1 },
    '7/8': { notehead: 'noteheadHalf', noteValue: 'h', flags: 0, dots: 2 },

    '1/4': { notehead: 'noteheadBlack', noteValue: 'q', flags: 0, dots: 0 },
    '3/8': { notehead: 'noteheadBlack', noteValue: 'q', flags: 0, dots: 1 },
    '7/16': { notehead: 'noteheadBlack', noteValue: 'q', flags: 0, dots: 2 },

    '1/8': { notehead: 'noteheadBlack', noteValue: '8', flags: 1, dots: 0 },
    '3/16': { notehead: 'noteheadBlack', noteValue: '8', flags: 1, dots: 1 },
    '7/32': { notehead: 'noteheadBlack', noteValue: '8', flags: 1, dots: 2 },

    '1/16': { notehead: 'noteheadBlack', noteValue: '16', flags: 2, dots: 0 },
    '3/32': { notehead: 'noteheadBlack', noteValue: '16', flags: 2, dots: 1 },
    '7/64': { notehead: 'noteheadBlack', noteValue: '16', flags: 2, dots: 2 },

    '1/32': { notehead: 'noteheadBlack', noteValue: '32', flags: 3, dots: 0 },
    '3/64': { notehead: 'noteheadBlack', noteValue: '32', flags: 3, dots: 1 },
    '7/128': { notehead: 'noteheadBlack', noteValue: '32', flags: 3, dots: 2 },

    '1/64': { notehead: 'noteheadBlack', noteValue: '64', flags: 4, dots: 0 },
    '3/128': { notehead: 'noteheadBlack', noteValue: '64', flags: 4, dots: 1 },
    '7/256': { notehead: 'noteheadBlack', noteValue: '64', flags: 4, dots: 2 },

    '1/128': { notehead: 'noteheadBlack', noteValue: '128', flags: 5, dots: 0 },
    '3/256': { notehead: 'noteheadBlack', noteValue: '128', flags: 5, dots: 1 },
    '7/512': { notehead: 'noteheadBlack', noteValue: '128', flags: 5, dots: 2 },

    '1/256': { notehead: 'noteheadBlack', noteValue: '256', flags: 6, dots: 0 },
    '3/512': { notehead: 'noteheadBlack', noteValue: '256', flags: 6, dots: 1 },
    '7/1024': { notehead: 'noteheadBlack', noteValue: '256', flags: 6, dots: 2 }
  },

  keySignatures: {
    'sharp': [4, 1, 5, 2, -1, 3],
    'flat': [0, 3, -1, 2, -2, 1]
  },

  accidentals: {
    '-2': 'accidentalDoubleFlat',
    '-1': 'accidentalFlat',
    '0': 'accidentalNatural',
    '1': 'accidentalSharp',
    '2': 'accidentalDoubleSharp'
  },

  smuflCodepoints: {
    'accidentalArrowDown': '\uE27B',
    'accidentalArrowUp': '\uE27A',
    'accidentalCombiningCloseCurlyBrace': '\uE2EF',
    'accidentalCombiningOpenCurlyBrace': '\uE2EE',
    'accidentalCommaSlashDown': '\uE47A',
    'accidentalCommaSlashUp': '\uE479',
    'accidentalDoubleFlat': '\uE264',
    'accidentalDoubleFlatOneArrowDown': '\uE2C0',
    'accidentalDoubleFlatOneArrowUp': '\uE2C5',
    'accidentalDoubleFlatReversed': '\uE483',
    'accidentalDoubleFlatThreeArrowsDown': '\uE2D4',
    'accidentalDoubleFlatThreeArrowsUp': '\uE2D9',
    'accidentalDoubleFlatTurned': '\uE485',
    'accidentalDoubleFlatTwoArrowsDown': '\uE2CA',
    'accidentalDoubleFlatTwoArrowsUp': '\uE2CF',
    'accidentalDoubleSharp': '\uE263',
    'accidentalDoubleSharpEqualTempered': '\uE2F4',
    'accidentalDoubleSharpOneArrowDown': '\uE2C4',
    'accidentalDoubleSharpOneArrowUp': '\uE2C9',
    'accidentalDoubleSharpThreeArrowsDown': '\uE2D8',
    'accidentalDoubleSharpThreeArrowsUp': '\uE2DD',
    'accidentalDoubleSharpTwoArrowsDown': '\uE2CE',
    'accidentalDoubleSharpTwoArrowsUp': '\uE2D3',
    'accidentalFilledReversedFlatAndFlat': '\uE296',
    'accidentalFilledReversedFlatAndFlatArrowDown': '\uE298',
    'accidentalFilledReversedFlatAndFlatArrowUp': '\uE297',
    'accidentalFilledReversedFlatArrowDown': '\uE293',
    'accidentalFilledReversedFlatArrowUp': '\uE292',
    'accidentalFiveQuarterTonesFlatArrowDown': '\uE279',
    'accidentalFiveQuarterTonesSharpArrowUp': '\uE276',
    'accidentalFlat': '\uE260',
    'accidentalFlatOneArrowDown': '\uE2C1',
    'accidentalFlatOneArrowUp': '\uE2C6',
    'accidentalFlatThreeArrowsDown': '\uE2D5',
    'accidentalFlatThreeArrowsUp': '\uE2DA',
    'accidentalFlatTurned': '\uE484',
    'accidentalFlatTwoArrowsDown': '\uE2CB',
    'accidentalFlatTwoArrowsUp': '\uE2D0',
    'accidentalHalfSharpArrowDown': '\uE29A',
    'accidentalHalfSharpArrowUp': '\uE299',
    'accidentalLargeDoubleSharp': '\uE47D',
    'accidentalNatural': '\uE261',
    'accidentalNaturalFlat': '\uE267',
    'accidentalNaturalOneArrowDown': '\uE2C2',
    'accidentalNaturalOneArrowUp': '\uE2C7',
    'accidentalNaturalReversed': '\uE482',
    'accidentalNaturalSharp': '\uE268',
    'accidentalNaturalThreeArrowsDown': '\uE2D6',
    'accidentalNaturalThreeArrowsUp': '\uE2DB',
    'accidentalNaturalTwoArrowsDown': '\uE2CC',
    'accidentalNaturalTwoArrowsUp': '\uE2D1',
    'accidentalOneAndAHalfSharpsArrowDown': '\uE29C',
    'accidentalOneAndAHalfSharpsArrowUp': '\uE29B',
    'accidentalOneThirdToneFlatFerneyhough': '\uE48B',
    'accidentalOneThirdToneSharpFerneyhough': '\uE48A',
    'accidentalParensLeft': '\uE26A',
    'accidentalParensRight': '\uE26B',
    'accidentalQuarterToneFlat4': '\uE47F',
    'accidentalQuarterToneFlatArrowUp': '\uE270',
    'accidentalQuarterToneFlatFilledReversed': '\uE480',
    'accidentalQuarterToneFlatNaturalArrowDown': '\uE273',
    'accidentalQuarterToneSharp4': '\uE47E',
    'accidentalQuarterToneSharpArrowDown': '\uE275',
    'accidentalQuarterToneSharpBusotti': '\uE472',
    'accidentalQuarterToneSharpNaturalArrowUp': '\uE272',
    'accidentalQuarterToneSharpStein': '\uE282',
    'accidentalQuarterToneSharpWiggle': '\uE475',
    'accidentalRaiseOneSeptimalComma': '\uE2DF',
    'accidentalRaiseOneTridecimalQuartertone': '\uE2E5',
    'accidentalRaiseOneUndecimalQuartertone': '\uE2E3',
    'accidentalRaiseTwoSeptimalCommas': '\uE2E1',
    'accidentalReversedFlatAndFlatArrowDown': '\uE295',
    'accidentalReversedFlatAndFlatArrowUp': '\uE294',
    'accidentalReversedFlatArrowDown': '\uE291',
    'accidentalReversedFlatArrowUp': '\uE290',
    'accidentalSharp': '\uE262',
    'accidentalSharpOneArrowDown': '\uE2C3',
    'accidentalSharpOneArrowUp': '\uE2C8',
    'accidentalSharpOneHorizontalStroke': '\uE473',
    'accidentalSharpReversed': '\uE481',
    'accidentalSharpSharp': '\uE269',
    'accidentalSharpThreeArrowsDown': '\uE2D7',
    'accidentalSharpThreeArrowsUp': '\uE2DC',
    'accidentalSharpTwoArrowsDown': '\uE2CD',
    'accidentalSharpTwoArrowsUp': '\uE2D2',
    'accidentalThreeQuarterTonesFlatArrowDown': '\uE271',
    'accidentalThreeQuarterTonesFlatArrowUp': '\uE278',
    'accidentalThreeQuarterTonesFlatCouper': '\uE489',
    'accidentalThreeQuarterTonesFlatGrisey': '\uE486',
    'accidentalThreeQuarterTonesFlatTartini': '\uE487',
    'accidentalThreeQuarterTonesFlatZimmermann': '\uE281',
    'accidentalThreeQuarterTonesSharpArrowDown': '\uE277',
    'accidentalThreeQuarterTonesSharpArrowUp': '\uE274',
    'accidentalThreeQuarterTonesSharpBusotti': '\uE474',
    'accidentalThreeQuarterTonesSharpStein': '\uE283',
    'accidentalTripleFlat': '\uE266',
    'accidentalTripleSharp': '\uE265',
    'arpeggiatoDown': '\uE635',
    'arpeggiatoUp': '\uE634',
    'arrowBlackDown': '\uEB64',
    'arrowBlackDownLeft': '\uEB65',
    'arrowBlackDownRight': '\uEB63',
    'arrowBlackLeft': '\uEB66',
    'arrowBlackRight': '\uEB62',
    'arrowBlackUp': '\uEB60',
    'arrowBlackUpLeft': '\uEB67',
    'arrowBlackUpRight': '\uEB61',
    'arrowOpenDown': '\uEB74',
    'arrowOpenDownLeft': '\uEB75',
    'arrowOpenDownRight': '\uEB73',
    'arrowOpenLeft': '\uEB76',
    'arrowOpenRight': '\uEB72',
    'arrowOpenUp': '\uEB70',
    'arrowOpenUpLeft': '\uEB77',
    'arrowOpenUpRight': '\uEB71',
    'arrowWhiteDown': '\uEB6C',
    'arrowWhiteDownLeft': '\uEB6D',
    'arrowWhiteDownRight': '\uEB6B',
    'arrowWhiteLeft': '\uEB6E',
    'arrowWhiteRight': '\uEB6A',
    'arrowWhiteUp': '\uEB68',
    'arrowWhiteUpLeft': '\uEB6F',
    'arrowWhiteUpRight': '\uEB69',
    'arrowheadBlackDown': '\uEB7C',
    'arrowheadBlackDownLeft': '\uEB7D',
    'arrowheadBlackDownRight': '\uEB7B',
    'arrowheadBlackLeft': '\uEB7E',
    'arrowheadBlackRight': '\uEB7A',
    'arrowheadBlackUp': '\uEB78',
    'arrowheadBlackUpLeft': '\uEB7F',
    'arrowheadBlackUpRight': '\uEB79',
    'arrowheadOpenDown': '\uEB8C',
    'arrowheadOpenDownLeft': '\uEB8D',
    'arrowheadOpenDownRight': '\uEB8B',
    'arrowheadOpenLeft': '\uEB8E',
    'arrowheadOpenRight': '\uEB8A',
    'arrowheadOpenUp': '\uEB88',
    'arrowheadOpenUpLeft': '\uEB8F',
    'arrowheadOpenUpRight': '\uEB89',
    'arrowheadWhiteDown': '\uEB84',
    'arrowheadWhiteDownLeft': '\uEB85',
    'arrowheadWhiteDownRight': '\uEB83',
    'arrowheadWhiteLeft': '\uEB86',
    'arrowheadWhiteRight': '\uEB82',
    'arrowheadWhiteUp': '\uEB80',
    'arrowheadWhiteUpLeft': '\uEB87',
    'arrowheadWhiteUpRight': '\uEB81',
    'articAccentAbove': '\uE4A0',
    'articAccentBelow': '\uE4A1',
    'articAccentStaccatoAbove': '\uE4B0',
    'articAccentStaccatoBelow': '\uE4B1',
    'articLaissezVibrerAbove': '\uE4BA',
    'articLaissezVibrerBelow': '\uE4BB',
    'articMarcatoAbove': '\uE4AC',
    'articMarcatoBelow': '\uE4AD',
    'articMarcatoStaccatoAbove': '\uE4AE',
    'articMarcatoStaccatoBelow': '\uE4AF',
    'articMarcatoTenutoAbove': '\uE4BC',
    'articMarcatoTenutoBelow': '\uE4BD',
    'articStaccatissimoAbove': '\uE4A6',
    'articStaccatissimoBelow': '\uE4A7',
    'articStaccatissimoStrokeAbove': '\uE4AA',
    'articStaccatissimoStrokeBelow': '\uE4AB',
    'articStaccatissimoWedgeAbove': '\uE4A8',
    'articStaccatissimoWedgeBelow': '\uE4A9',
    'articStaccatoAbove': '\uE4A2',
    'articStaccatoBelow': '\uE4A3',
    'articStressAbove': '\uE4B6',
    'articStressBelow': '\uE4B7',
    'articTenutoAbove': '\uE4A4',
    'articTenutoAccentAbove': '\uE4B4',
    'articTenutoAccentBelow': '\uE4B5',
    'articTenutoBelow': '\uE4A5',
    'articTenutoStaccatoAbove': '\uE4B2',
    'articTenutoStaccatoBelow': '\uE4B3',
    'articUnstressAbove': '\uE4B8',
    'articUnstressBelow': '\uE4B9',
    'augmentationDot': '\uE1E7',
    'barlineDashed': '\uE036',
    'barlineDotted': '\uE037',
    'barlineDouble': '\uE031',
    'barlineFinal': '\uE032',
    'barlineHeavy': '\uE034',
    'barlineHeavyHeavy': '\uE035',
    'barlineReverseFinal': '\uE033',
    'barlineShort': '\uE038',
    'barlineSingle': '\uE030',
    'barlineTick': '\uE039',
    'brace': '\uE000',
    'bracket': '\uE002',
    'bracketBottom': '\uE004',
    'bracketTop': '\uE003',
    'breathMarkComma': '\uE4CE',
    'breathMarkSalzedo': '\uE4D5',
    'breathMarkTick': '\uE4CF',
    'breathMarkUpbow': '\uE4D0',
    'bridgeClef': '\uE078',
    'buzzRoll': '\uE22A',
    'cClef': '\uE05C',
    'cClef8vb': '\uE05D',
    'cClefArrowDown': '\uE05F',
    'cClefArrowUp': '\uE05E',
    'cClefChange': '\uE07B',
    'cClefCombining': '\uE061',
    'cClefReversed': '\uE075',
    'cClefSquare': '\uE060',
    'caesura': '\uE4D1',
    'caesuraCurved': '\uE4D4',
    'caesuraShort': '\uE4D3',
    'caesuraThick': '\uE4D2',
    'clef15': '\uE07E',
    'clef8': '\uE07D',
    'clefChangeCombining': '\uE07F',
    'coda': '\uE048',
    'codaSquare': '\uE049',
    'csymAugmented': '\uE872',
    'csymBracketLeftTall': '\uE877',
    'csymBracketRightTall': '\uE878',
    'csymDiminished': '\uE870',
    'csymHalfDiminished': '\uE871',
    'csymMajorSeventh': '\uE873',
    'csymMinor': '\uE874',
    'csymParensLeftTall': '\uE875',
    'csymParensRightTall': '\uE876',
    'curlewSign': '\uE4D6',
    'daCapo': '\uE046',
    'dalSegno': '\uE045',
    'dynamicFF': '\uE52F',
    'dynamicFFF': '\uE530',
    'dynamicFFFF': '\uE531',
    'dynamicFFFFF': '\uE532',
    'dynamicFFFFFF': '\uE533',
    'dynamicForte': '\uE522',
    'dynamicFortePiano': '\uE534',
    'dynamicForzando': '\uE535',
    'dynamicMF': '\uE52D',
    'dynamicMP': '\uE52C',
    'dynamicMessaDiVoce': '\uE540',
    'dynamicMezzo': '\uE521',
    'dynamicNiente': '\uE526',
    'dynamicNienteForHairpin': '\uE541',
    'dynamicPF': '\uE52E',
    'dynamicPP': '\uE52B',
    'dynamicPPP': '\uE52A',
    'dynamicPPPP': '\uE529',
    'dynamicPPPPP': '\uE528',
    'dynamicPPPPPP': '\uE527',
    'dynamicPiano': '\uE520',
    'dynamicRinforzando': '\uE523',
    'dynamicRinforzando1': '\uE53C',
    'dynamicRinforzando2': '\uE53D',
    'dynamicSforzando': '\uE524',
    'dynamicSforzando1': '\uE536',
    'dynamicSforzandoPianissimo': '\uE538',
    'dynamicSforzandoPiano': '\uE537',
    'dynamicSforzato': '\uE539',
    'dynamicSforzatoFF': '\uE53B',
    'dynamicSforzatoPiano': '\uE53A',
    'dynamicZ': '\uE525',
    'fClef': '\uE062',
    'fClef15ma': '\uE066',
    'fClef15mb': '\uE063',
    'fClef8va': '\uE065',
    'fClef8vb': '\uE064',
    'fClefArrowDown': '\uE068',
    'fClefArrowUp': '\uE067',
    'fClefChange': '\uE07C',
    'fClefReversed': '\uE076',
    'fClefTurned': '\uE077',
    'fermataAbove': '\uE4C0',
    'fermataBelow': '\uE4C1',
    'fermataLongAbove': '\uE4C6',
    'fermataLongBelow': '\uE4C7',
    'fermataLongHenzeAbove': '\uE4CA',
    'fermataLongHenzeBelow': '\uE4CB',
    'fermataShortAbove': '\uE4C4',
    'fermataShortBelow': '\uE4C5',
    'fermataShortHenzeAbove': '\uE4CC',
    'fermataShortHenzeBelow': '\uE4CD',
    'fermataVeryLongAbove': '\uE4C8',
    'fermataVeryLongBelow': '\uE4C9',
    'fermataVeryShortAbove': '\uE4C2',
    'fermataVeryShortBelow': '\uE4C3',
    'flag1024thDown': '\uE24F',
    'flag1024thUp': '\uE24E',
    'flag128thDown': '\uE249',
    'flag128thUp': '\uE248',
    'flag16thDown': '\uE243',
    'flag16thUp': '\uE242',
    'flag256thDown': '\uE24B',
    'flag256thUp': '\uE24A',
    'flag32ndDown': '\uE245',
    'flag32ndUp': '\uE244',
    'flag512thDown': '\uE24D',
    'flag512thUp': '\uE24C',
    'flag64thDown': '\uE247',
    'flag64thUp': '\uE246',
    'flag8thDown': '\uE241',
    'flag8thUp': '\uE240',
    'flagInternalDown': '\uE251',
    'flagInternalUp': '\uE250',
    'gClef': '\uE050',
    'gClef15ma': '\uE054',
    'gClef15mb': '\uE051',
    'gClef8va': '\uE053',
    'gClef8vb': '\uE052',
    'gClef8vbCClef': '\uE056',
    'gClef8vbOld': '\uE055',
    'gClef8vbParens': '\uE057',
    'gClefArrowDown': '\uE05B',
    'gClefArrowUp': '\uE05A',
    'gClefChange': '\uE07A',
    'gClefLigatedNumberAbove': '\uE059',
    'gClefLigatedNumberBelow': '\uE058',
    'gClefReversed': '\uE073',
    'gClefTurned': '\uE074',
    'glissandoDown': '\uE586',
    'glissandoUp': '\uE585',
    'graceNoteAcciaccaturaStemDown': '\uE561',
    'graceNoteAcciaccaturaStemUp': '\uE560',
    'graceNoteAppoggiaturaStemDown': '\uE563',
    'graceNoteAppoggiaturaStemUp': '\uE562',
    'graceNoteSlashStemDown': '\uE565',
    'graceNoteSlashStemUp': '\uE564',
    'keyboardPedalD': '\uE653',
    'keyboardPedalDot': '\uE654',
    'keyboardPedalE': '\uE652',
    'keyboardPedalHalf': '\uE656',
    'keyboardPedalHalf2': '\uE65B',
    'keyboardPedalHalf3': '\uE65C',
    'keyboardPedalHeel1': '\uE661',
    'keyboardPedalHeel2': '\uE662',
    'keyboardPedalHeel3': '\uE663',
    'keyboardPedalHeelToe': '\uE666',
    'keyboardPedalHyphen': '\uE658',
    'keyboardPedalP': '\uE651',
    'keyboardPedalPed': '\uE650',
    'keyboardPedalS': '\uE65A',
    'keyboardPedalSost': '\uE659',
    'keyboardPedalToe1': '\uE664',
    'keyboardPedalToe2': '\uE665',
    'keyboardPedalUp': '\uE655',
    'keyboardPedalUpNotch': '\uE657',
    'leftRepeatSmall': '\uE04C',
    'legerLine': '\uE022',
    'legerLineNarrow': '\uE024',
    'legerLineWide': '\uE023',
    'lyricsElision': '\uE551',
    'lyricsElisionNarrow': '\uE550',
    'lyricsElisionWide': '\uE552',
    'lyricsHyphenBaseline': '\uE553',
    'lyricsHyphenBaselineNonBreaking': '\uE554',
    'miscEyeglasses': '\uEC62',
    'note1024thDown': '\uE1E6',
    'note1024thUp': '\uE1E5',
    'note128thDown': '\uE1E0',
    'note128thUp': '\uE1DF',
    'note16thDown': '\uE1DA',
    'note16thUp': '\uE1D9',
    'note256thDown': '\uE1E2',
    'note256thUp': '\uE1E1',
    'note32ndDown': '\uE1DC',
    'note32ndUp': '\uE1DB',
    'note512thDown': '\uE1E4',
    'note512thUp': '\uE1E3',
    'note64thDown': '\uE1DE',
    'note64thUp': '\uE1DD',
    'note8thDown': '\uE1D8',
    'note8thUp': '\uE1D7',
    'noteABlack': '\uE197',
    'noteAFlatBlack': '\uE196',
    'noteAFlatHalf': '\uE17F',
    'noteAFlatWhole': '\uE168',
    'noteAHalf': '\uE180',
    'noteASharpBlack': '\uE198',
    'noteASharpHalf': '\uE181',
    'noteASharpWhole': '\uE16A',
    'noteAWhole': '\uE169',
    'noteBBlack': '\uE19A',
    'noteBFlatBlack': '\uE199',
    'noteBFlatHalf': '\uE182',
    'noteBFlatWhole': '\uE16B',
    'noteBHalf': '\uE183',
    'noteBSharpBlack': '\uE19B',
    'noteBSharpHalf': '\uE184',
    'noteBSharpWhole': '\uE16D',
    'noteBWhole': '\uE16C',
    'noteCBlack': '\uE19D',
    'noteCFlatBlack': '\uE19C',
    'noteCFlatHalf': '\uE185',
    'noteCFlatWhole': '\uE16E',
    'noteCHalf': '\uE186',
    'noteCSharpBlack': '\uE19E',
    'noteCSharpHalf': '\uE187',
    'noteCSharpWhole': '\uE170',
    'noteCWhole': '\uE16F',
    'noteDBlack': '\uE1A0',
    'noteDFlatBlack': '\uE19F',
    'noteDFlatHalf': '\uE188',
    'noteDFlatWhole': '\uE171',
    'noteDHalf': '\uE189',
    'noteDSharpBlack': '\uE1A1',
    'noteDSharpHalf': '\uE18A',
    'noteDSharpWhole': '\uE173',
    'noteDWhole': '\uE172',
    'noteDoBlack': '\uE160',
    'noteDoHalf': '\uE158',
    'noteDoWhole': '\uE150',
    'noteDoubleWhole': '\uE1D0',
    'noteDoubleWholeSquare': '\uE1D1',
    'noteEBlack': '\uE1A3',
    'noteEFlatBlack': '\uE1A2',
    'noteEFlatHalf': '\uE18B',
    'noteEFlatWhole': '\uE174',
    'noteEHalf': '\uE18C',
    'noteESharpBlack': '\uE1A4',
    'noteESharpHalf': '\uE18D',
    'noteESharpWhole': '\uE176',
    'noteEWhole': '\uE175',
    'noteEmptyBlack': '\uE1AF',
    'noteEmptyHalf': '\uE1AE',
    'noteEmptyWhole': '\uE1AD',
    'noteFBlack': '\uE1A6',
    'noteFFlatBlack': '\uE1A5',
    'noteFFlatHalf': '\uE18E',
    'noteFFlatWhole': '\uE177',
    'noteFHalf': '\uE18F',
    'noteFSharpBlack': '\uE1A7',
    'noteFSharpHalf': '\uE190',
    'noteFSharpWhole': '\uE179',
    'noteFWhole': '\uE178',
    'noteFaBlack': '\uE163',
    'noteFaHalf': '\uE15B',
    'noteFaWhole': '\uE153',
    'noteGBlack': '\uE1A9',
    'noteGFlatBlack': '\uE1A8',
    'noteGFlatHalf': '\uE191',
    'noteGFlatWhole': '\uE17A',
    'noteGHalf': '\uE192',
    'noteGSharpBlack': '\uE1AA',
    'noteGSharpHalf': '\uE193',
    'noteGSharpWhole': '\uE17C',
    'noteGWhole': '\uE17B',
    'noteHBlack': '\uE1AB',
    'noteHHalf': '\uE194',
    'noteHSharpBlack': '\uE1AC',
    'noteHSharpHalf': '\uE195',
    'noteHSharpWhole': '\uE17E',
    'noteHWhole': '\uE17D',
    'noteHalfDown': '\uE1D4',
    'noteHalfUp': '\uE1D3',
    'noteLaBlack': '\uE165',
    'noteLaHalf': '\uE15D',
    'noteLaWhole': '\uE155',
    'noteMiBlack': '\uE162',
    'noteMiHalf': '\uE15A',
    'noteMiWhole': '\uE152',
    'noteQuarterDown': '\uE1D6',
    'noteQuarterUp': '\uE1D5',
    'noteReBlack': '\uE161',
    'noteReHalf': '\uE159',
    'noteReWhole': '\uE151',
    'noteShapeArrowheadLeftBlack': '\uE1C9',
    'noteShapeArrowheadLeftWhite': '\uE1C8',
    'noteShapeDiamondBlack': '\uE1B9',
    'noteShapeDiamondWhite': '\uE1B8',
    'noteShapeIsoscelesTriangleBlack': '\uE1C5',
    'noteShapeIsoscelesTriangleWhite': '\uE1C4',
    'noteShapeKeystoneBlack': '\uE1C1',
    'noteShapeKeystoneWhite': '\uE1C0',
    'noteShapeMoonBlack': '\uE1BD',
    'noteShapeMoonLeftBlack': '\uE1C7',
    'noteShapeMoonLeftWhite': '\uE1C6',
    'noteShapeMoonWhite': '\uE1BC',
    'noteShapeQuarterMoonBlack': '\uE1C3',
    'noteShapeQuarterMoonWhite': '\uE1C2',
    'noteShapeRoundBlack': '\uE1B1',
    'noteShapeRoundWhite': '\uE1B0',
    'noteShapeSquareBlack': '\uE1B3',
    'noteShapeSquareWhite': '\uE1B2',
    'noteShapeTriangleLeftBlack': '\uE1B7',
    'noteShapeTriangleLeftWhite': '\uE1B6',
    'noteShapeTriangleRightBlack': '\uE1B5',
    'noteShapeTriangleRightWhite': '\uE1B4',
    'noteShapeTriangleRoundBlack': '\uE1BF',
    'noteShapeTriangleRoundLeftBlack': '\uE1CB',
    'noteShapeTriangleRoundLeftWhite': '\uE1CA',
    'noteShapeTriangleRoundWhite': '\uE1BE',
    'noteShapeTriangleUpBlack': '\uE1BB',
    'noteShapeTriangleUpWhite': '\uE1BA',
    'noteSiBlack': '\uE167',
    'noteSiHalf': '\uE15F',
    'noteSiWhole': '\uE157',
    'noteSoBlack': '\uE164',
    'noteSoHalf': '\uE15C',
    'noteSoWhole': '\uE154',
    'noteTiBlack': '\uE166',
    'noteTiHalf': '\uE15E',
    'noteTiWhole': '\uE156',
    'noteWhole': '\uE1D2',
    'noteheadBlack': '\uE0A4',
    'noteheadCircleSlash': '\uE0F7',
    'noteheadCircleX': '\uE0B3',
    'noteheadCircleXDoubleWhole': '\uE0B0',
    'noteheadCircleXHalf': '\uE0B2',
    'noteheadCircleXWhole': '\uE0B1',
    'noteheadCircledBlack': '\uE0E4',
    'noteheadCircledBlackLarge': '\uE0E8',
    'noteheadCircledDoubleWhole': '\uE0E7',
    'noteheadCircledDoubleWholeLarge': '\uE0EB',
    'noteheadCircledHalf': '\uE0E5',
    'noteheadCircledHalfLarge': '\uE0E9',
    'noteheadCircledWhole': '\uE0E6',
    'noteheadCircledWholeLarge': '\uE0EA',
    'noteheadCircledXLarge': '\uE0EC',
    'noteheadClusterDoubleWhole2nd': '\uE124',
    'noteheadClusterDoubleWhole3rd': '\uE128',
    'noteheadClusterDoubleWholeBottom': '\uE12E',
    'noteheadClusterDoubleWholeMiddle': '\uE12D',
    'noteheadClusterDoubleWholeTop': '\uE12C',
    'noteheadClusterHalf2nd': '\uE126',
    'noteheadClusterHalf3rd': '\uE12A',
    'noteheadClusterHalfBottom': '\uE134',
    'noteheadClusterHalfMiddle': '\uE133',
    'noteheadClusterHalfTop': '\uE132',
    'noteheadClusterQuarter2nd': '\uE127',
    'noteheadClusterQuarter3rd': '\uE12B',
    'noteheadClusterQuarterBottom': '\uE137',
    'noteheadClusterQuarterMiddle': '\uE136',
    'noteheadClusterQuarterTop': '\uE135',
    'noteheadClusterRoundBlack': '\uE123',
    'noteheadClusterRoundWhite': '\uE122',
    'noteheadClusterSquareBlack': '\uE121',
    'noteheadClusterSquareWhite': '\uE120',
    'noteheadClusterWhole2nd': '\uE125',
    'noteheadClusterWhole3rd': '\uE129',
    'noteheadClusterWholeBottom': '\uE131',
    'noteheadClusterWholeMiddle': '\uE130',
    'noteheadClusterWholeTop': '\uE12F',
    'noteheadDiamondBlack': '\uE0DB',
    'noteheadDiamondBlackOld': '\uE0E2',
    'noteheadDiamondBlackWide': '\uE0DC',
    'noteheadDiamondClusterBlack2nd': '\uE139',
    'noteheadDiamondClusterBlack3rd': '\uE13B',
    'noteheadDiamondClusterBlackBottom': '\uE141',
    'noteheadDiamondClusterBlackMiddle': '\uE140',
    'noteheadDiamondClusterBlackTop': '\uE13F',
    'noteheadDiamondClusterWhite2nd': '\uE138',
    'noteheadDiamondClusterWhite3rd': '\uE13A',
    'noteheadDiamondClusterWhiteBottom': '\uE13E',
    'noteheadDiamondClusterWhiteMiddle': '\uE13D',
    'noteheadDiamondClusterWhiteTop': '\uE13C',
    'noteheadDiamondDoubleWhole': '\uE0D7',
    'noteheadDiamondDoubleWholeOld': '\uE0DF',
    'noteheadDiamondHalf': '\uE0D9',
    'noteheadDiamondHalfFilled': '\uE0E3',
    'noteheadDiamondHalfOld': '\uE0E1',
    'noteheadDiamondHalfWide': '\uE0DA',
    'noteheadDiamondOpen': '\uE0FC',
    'noteheadDiamondWhite': '\uE0DD',
    'noteheadDiamondWhiteWide': '\uE0DE',
    'noteheadDiamondWhole': '\uE0D8',
    'noteheadDiamondWholeOld': '\uE0E0',
    'noteheadDoubleWhole': '\uE0A0',
    'noteheadDoubleWholeSquare': '\uE0A1',
    'noteheadDoubleWholeWithX': '\uE0B4',
    'noteheadHalf': '\uE0A3',
    'noteheadHalfFilled': '\uE0FB',
    'noteheadHalfWithX': '\uE0B6',
    'noteheadHeavyX': '\uE0F8',
    'noteheadHeavyXHat': '\uE0F9',
    'noteheadLargeArrowDownBlack': '\uE0F4',
    'noteheadLargeArrowDownDoubleWhole': '\uE0F1',
    'noteheadLargeArrowDownHalf': '\uE0F3',
    'noteheadLargeArrowDownWhole': '\uE0F2',
    'noteheadLargeArrowUpBlack': '\uE0F0',
    'noteheadLargeArrowUpDoubleWhole': '\uE0ED',
    'noteheadLargeArrowUpHalf': '\uE0EF',
    'noteheadLargeArrowUpWhole': '\uE0EE',
    'noteheadMoonBlack': '\uE0CB',
    'noteheadMoonWhite': '\uE0CA',
    'noteheadNull': '\uE0A5',
    'noteheadParenthesis': '\uE0CE',
    'noteheadParenthesisLeft': '\uE0F5',
    'noteheadParenthesisRight': '\uE0F6',
    'noteheadPlusBlack': '\uE0AF',
    'noteheadPlusDoubleWhole': '\uE0AC',
    'noteheadPlusHalf': '\uE0AE',
    'noteheadPlusWhole': '\uE0AD',
    'noteheadRectangularClusterBlackBottom': '\uE144',
    'noteheadRectangularClusterBlackMiddle': '\uE143',
    'noteheadRectangularClusterBlackTop': '\uE142',
    'noteheadRectangularClusterWhiteBottom': '\uE147',
    'noteheadRectangularClusterWhiteMiddle': '\uE146',
    'noteheadRectangularClusterWhiteTop': '\uE145',
    'noteheadRoundBlack': '\uE113',
    'noteheadRoundBlackLarge': '\uE110',
    'noteheadRoundBlackSlashed': '\uE118',
    'noteheadRoundBlackSlashedLarge': '\uE116',
    'noteheadRoundWhite': '\uE114',
    'noteheadRoundWhiteLarge': '\uE111',
    'noteheadRoundWhiteSlashed': '\uE119',
    'noteheadRoundWhiteSlashedLarge': '\uE117',
    'noteheadRoundWhiteWithDot': '\uE115',
    'noteheadRoundWhiteWithDotLarge': '\uE112',
    'noteheadSlashDiamondWhite': '\uE104',
    'noteheadSlashHorizontalEnds': '\uE101',
    'noteheadSlashHorizontalEndsMuted': '\uE108',
    'noteheadSlashVerticalEnds': '\uE100',
    'noteheadSlashVerticalEndsMuted': '\uE107',
    'noteheadSlashVerticalEndsSmall': '\uE105',
    'noteheadSlashWhiteHalf': '\uE103',
    'noteheadSlashWhiteMuted': '\uE109',
    'noteheadSlashWhiteWhole': '\uE102',
    'noteheadSlashX': '\uE106',
    'noteheadSlashedBlack1': '\uE0CF',
    'noteheadSlashedBlack2': '\uE0D0',
    'noteheadSlashedDoubleWhole1': '\uE0D5',
    'noteheadSlashedDoubleWhole2': '\uE0D6',
    'noteheadSlashedHalf1': '\uE0D1',
    'noteheadSlashedHalf2': '\uE0D2',
    'noteheadSlashedWhole1': '\uE0D3',
    'noteheadSlashedWhole2': '\uE0D4',
    'noteheadSquareBlack': '\uE0B9',
    'noteheadSquareBlackLarge': '\uE11A',
    'noteheadSquareBlackWhite': '\uE11B',
    'noteheadSquareWhite': '\uE0B8',
    'noteheadTriangleDownBlack': '\uE0C7',
    'noteheadTriangleDownDoubleWhole': '\uE0C3',
    'noteheadTriangleDownHalf': '\uE0C5',
    'noteheadTriangleDownWhite': '\uE0C6',
    'noteheadTriangleDownWhole': '\uE0C4',
    'noteheadTriangleLeftBlack': '\uE0C0',
    'noteheadTriangleLeftWhite': '\uE0BF',
    'noteheadTriangleRightBlack': '\uE0C2',
    'noteheadTriangleRightWhite': '\uE0C1',
    'noteheadTriangleRoundDownBlack': '\uE0CD',
    'noteheadTriangleRoundDownWhite': '\uE0CC',
    'noteheadTriangleUpBlack': '\uE0BE',
    'noteheadTriangleUpDoubleWhole': '\uE0BA',
    'noteheadTriangleUpHalf': '\uE0BC',
    'noteheadTriangleUpRightBlack': '\uE0C9',
    'noteheadTriangleUpRightWhite': '\uE0C8',
    'noteheadTriangleUpWhite': '\uE0BD',
    'noteheadTriangleUpWhole': '\uE0BB',
    'noteheadVoidWithX': '\uE0B7',
    'noteheadWhole': '\uE0A2',
    'noteheadWholeFilled': '\uE0FA',
    'noteheadWholeWithX': '\uE0B5',
    'noteheadXBlack': '\uE0A9',
    'noteheadXDoubleWhole': '\uE0A6',
    'noteheadXHalf': '\uE0A8',
    'noteheadXOrnate': '\uE0AA',
    'noteheadXOrnateEllipse': '\uE0AB',
    'noteheadXWhole': '\uE0A7',
    'octaveBaselineA': '\uEC91',
    'octaveBaselineB': '\uEC93',
    'octaveBaselineM': '\uEC95',
    'octaveBaselineV': '\uEC97',
    'octaveBassa': '\uE51F',
    'octaveLoco': '\uEC90',
    'octaveParensLeft': '\uE51A',
    'octaveParensRight': '\uE51B',
    'octaveSuperscriptA': '\uEC92',
    'octaveSuperscriptB': '\uEC94',
    'octaveSuperscriptM': '\uEC96',
    'octaveSuperscriptV': '\uEC98',
    'ornamentComma': '\uE581',
    'ornamentDoubleObliqueLinesAfterNote': '\uE57E',
    'ornamentDoubleObliqueLinesBeforeNote': '\uE57D',
    'ornamentDownCurve': '\uE578',
    'ornamentHaydn': '\uE56F',
    'ornamentHighLeftConcaveStroke': '\uE592',
    'ornamentHighLeftConvexStroke': '\uE593',
    'ornamentHighRightConcaveStroke': '\uE5A2',
    'ornamentHighRightConvexStroke': '\uE5A3',
    'ornamentHookAfterNote': '\uE576',
    'ornamentHookBeforeNote': '\uE575',
    'ornamentLeftFacingHalfCircle': '\uE572',
    'ornamentLeftFacingHook': '\uE574',
    'ornamentLeftPlus': '\uE597',
    'ornamentLeftShakeT': '\uE596',
    'ornamentLeftVerticalStroke': '\uE594',
    'ornamentLeftVerticalStrokeWithCross': '\uE595',
    'ornamentMordent': '\uE56C',
    'ornamentMordentInverted': '\uE56D',
    'ornamentOriscus': '\uEA21',
    'ornamentPinceCouperin': '\uE588',
    'ornamentPortDeVoixV': '\uE570',
    'ornamentQuilisma': '\uEA20',
    'ornamentRightFacingHalfCircle': '\uE571',
    'ornamentRightFacingHook': '\uE573',
    'ornamentRightVerticalStroke': '\uE5A4',
    'ornamentSchleifer': '\uE587',
    'ornamentShake3': '\uE582',
    'ornamentShakeMuffat1': '\uE584',
    'ornamentShortObliqueLineAfterNote': '\uE57A',
    'ornamentShortObliqueLineBeforeNote': '\uE579',
    'ornamentTopLeftConcaveStroke': '\uE590',
    'ornamentTopLeftConvexStroke': '\uE591',
    'ornamentTopRightConcaveStroke': '\uE5A0',
    'ornamentTopRightConvexStroke': '\uE5A1',
    'ornamentTremblement': '\uE56E',
    'ornamentTremblementCouperin': '\uE589',
    'ornamentTrill': '\uE566',
    'ornamentTurn': '\uE567',
    'ornamentTurnInverted': '\uE568',
    'ornamentTurnSlash': '\uE569',
    'ornamentTurnUp': '\uE56A',
    'ornamentTurnUpS': '\uE56B',
    'ornamentUpCurve': '\uE577',
    'ornamentVerticalLine': '\uE583',
    'ornamentZigZagLineNoRightEnd': '\uE59D',
    'ornamentZigZagLineWithRightEnd': '\uE59E',
    'ottava': '\uE510',
    'ottavaAlta': '\uE511',
    'ottavaBassa': '\uE512',
    'ottavaBassaBa': '\uE513',
    'ottavaBassaVb': '\uE51C',
    'repeat1Bar': '\uE500',
    'repeat2Bars': '\uE501',
    'repeat4Bars': '\uE502',
    'repeatDot': '\uE044',
    'repeatDots': '\uE043',
    'repeatLeft': '\uE040',
    'repeatRight': '\uE041',
    'repeatRightLeft': '\uE042',
    'rest1024th': '\uE4ED',
    'rest128th': '\uE4EA',
    'rest16th': '\uE4E7',
    'rest256th': '\uE4EB',
    'rest32nd': '\uE4E8',
    'rest512th': '\uE4EC',
    'rest64th': '\uE4E9',
    'rest8th': '\uE4E6',
    'restDoubleWhole': '\uE4E2',
    'restDoubleWholeLegerLine': '\uE4F3',
    'restHBar': '\uE4EE',
    'restHBarLeft': '\uE4EF',
    'restHBarMiddle': '\uE4F0',
    'restHBarRight': '\uE4F1',
    'restHalf': '\uE4E4',
    'restHalfLegerLine': '\uE4F5',
    'restLonga': '\uE4E1',
    'restMaxima': '\uE4E0',
    'restQuarter': '\uE4E5',
    'restQuarterOld': '\uE4F2',
    'restQuarterZ': '\uE4F6',
    'restWhole': '\uE4E3',
    'restWholeLegerLine': '\uE4F4',
    'reversedBrace': '\uE001',
    'reversedBracketBottom': '\uE006',
    'reversedBracketTop': '\uE005',
    'rightRepeatSmall': '\uE04D',
    'segno': '\uE047',
    'segnoSerpent1': '\uE04A',
    'segnoSerpent2': '\uE04B',
    'semipitchedPercussionClef1': '\uE06B',
    'semipitchedPercussionClef2': '\uE06C',
    'splitBarDivider': '\uE00A',
    'staffDivideArrowDown': '\uE00B',
    'staffDivideArrowUp': '\uE00C',
    'staffDivideArrowUpDown': '\uE00D',
    'stem': '\uE210',
    'stemBowOnBridge': '\uE215',
    'stemBowOnTailpiece': '\uE216',
    'stemBuzzRoll': '\uE217',
    'stemDamp': '\uE218',
    'stemHarpStringNoise': '\uE21F',
    'stemMultiphonicsBlack': '\uE21A',
    'stemMultiphonicsBlackWhite': '\uE21C',
    'stemMultiphonicsWhite': '\uE21B',
    'stemPendereckiTremolo': '\uE213',
    'stemRimShot': '\uE21E',
    'stemSprechgesang': '\uE211',
    'stemSulPonticello': '\uE214',
    'stemSussurando': '\uE21D',
    'stemSwished': '\uE212',
    'stemVibratoPulse': '\uE219',
    'stringsBowBehindBridge': '\uE618',
    'stringsBowOnBridge': '\uE619',
    'stringsBowOnTailpiece': '\uE61A',
    'stringsChangeBowDirection': '\uE626',
    'stringsDownBow': '\uE610',
    'stringsDownBowTurned': '\uE611',
    'stringsFouette': '\uE622',
    'stringsHalfHarmonic': '\uE615',
    'stringsHarmonic': '\uE614',
    'stringsMuteOff': '\uE617',
    'stringsMuteOn': '\uE616',
    'stringsOverpressureDownBow': '\uE61B',
    'stringsOverpressureNoDirection': '\uE61F',
    'stringsOverpressurePossibileDownBow': '\uE61D',
    'stringsOverpressurePossibileUpBow': '\uE61E',
    'stringsOverpressureUpBow': '\uE61C',
    'stringsThumbPosition': '\uE624',
    'stringsThumbPositionTurned': '\uE625',
    'stringsUpBow': '\uE612',
    'stringsUpBowTurned': '\uE613',
    'stringsVibratoPulse': '\uE623',
    'systemDivider': '\uE007',
    'systemDividerExtraLong': '\uE009',
    'systemDividerLong': '\uE008',
    'textAugmentationDot': '\uE1FC',
    'textBlackNoteFrac16thLongStem': '\uE1F5',
    'textBlackNoteFrac16thShortStem': '\uE1F4',
    'textBlackNoteFrac32ndLongStem': '\uE1F6',
    'textBlackNoteFrac8thLongStem': '\uE1F3',
    'textBlackNoteFrac8thShortStem': '\uE1F2',
    'textBlackNoteLongStem': '\uE1F1',
    'textBlackNoteShortStem': '\uE1F0',
    'textCont16thBeamLongStem': '\uE1FA',
    'textCont16thBeamShortStem': '\uE1F9',
    'textCont32ndBeamLongStem': '\uE1FB',
    'textCont8thBeamLongStem': '\uE1F8',
    'textCont8thBeamShortStem': '\uE1F7',
    'textTie': '\uE1FD',
    'textTuplet3LongStem': '\uE202',
    'textTuplet3ShortStem': '\uE1FF',
    'textTupletBracketEndLongStem': '\uE203',
    'textTupletBracketEndShortStem': '\uE200',
    'textTupletBracketStartLongStem': '\uE201',
    'textTupletBracketStartShortStem': '\uE1FE',
    'timeSig0': '\uE080',
    'timeSig1': '\uE081',
    'timeSig2': '\uE082',
    'timeSig3': '\uE083',
    'timeSig4': '\uE084',
    'timeSig5': '\uE085',
    'timeSig6': '\uE086',
    'timeSig7': '\uE087',
    'timeSig8': '\uE088',
    'timeSig9': '\uE089',
    'timeSigBracketLeft': '\uEC80',
    'timeSigBracketLeftSmall': '\uEC82',
    'timeSigBracketRight': '\uEC81',
    'timeSigBracketRightSmall': '\uEC83',
    'timeSigCombDenominator': '\uE09F',
    'timeSigCombNumerator': '\uE09E',
    'timeSigComma': '\uE096',
    'timeSigCommon': '\uE08A',
    'timeSigCut2': '\uEC85',
    'timeSigCutCommon': '\uE08B',
    'timeSigEquals': '\uE08F',
    'timeSigFractionHalf': '\uE098',
    'timeSigFractionOneThird': '\uE09A',
    'timeSigFractionQuarter': '\uE097',
    'timeSigFractionThreeQuarters': '\uE099',
    'timeSigFractionTwoThirds': '\uE09B',
    'timeSigFractionalSlash': '\uE08E',
    'timeSigMinus': '\uE090',
    'timeSigMultiply': '\uE091',
    'timeSigOpenPenderecki': '\uE09D',
    'timeSigParensLeft': '\uE094',
    'timeSigParensLeftSmall': '\uE092',
    'timeSigParensRight': '\uE095',
    'timeSigParensRightSmall': '\uE093',
    'timeSigPlus': '\uE08C',
    'timeSigPlusSmall': '\uE08D',
    'timeSigSlash': '\uEC84',
    'timeSigX': '\uE09C',
    'tremolo1': '\uE220',
    'tremolo2': '\uE221',
    'tremolo3': '\uE222',
    'tremolo4': '\uE223',
    'tremolo5': '\uE224',
    'tremoloDivisiDots2': '\uE22E',
    'tremoloDivisiDots3': '\uE22F',
    'tremoloDivisiDots4': '\uE230',
    'tremoloDivisiDots6': '\uE231',
    'tremoloFingered1': '\uE225',
    'tremoloFingered2': '\uE226',
    'tremoloFingered3': '\uE227',
    'tremoloFingered4': '\uE228',
    'tremoloFingered5': '\uE229',
    'tripleTongueAbove': '\uE5F2',
    'tripleTongueBelow': '\uE5F3',
    'tuplet0': '\uE880',
    'tuplet1': '\uE881',
    'tuplet2': '\uE882',
    'tuplet3': '\uE883',
    'tuplet4': '\uE884',
    'tuplet5': '\uE885',
    'tuplet6': '\uE886',
    'tuplet7': '\uE887',
    'tuplet8': '\uE888',
    'tuplet9': '\uE889',
    'tupletColon': '\uE88A',
    'unmeasuredTremolo': '\uE22C',
    'unmeasuredTremoloSimple': '\uE22D',
    'unpitchedPercussionClef1': '\uE069',
    'unpitchedPercussionClef2': '\uE06A'
  }
};
