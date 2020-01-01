import * as assert from "assert";
import { parseDingLine, parseOrder, parseGenus, Genus, parseFamily, Family, Order, formatGenus, DictCard, formatDictCard, parseTranslate }
    from "../dingstructure";

import * as util from 'util';
const _trace = (what: any, depth = 0) => {
    console.log(_toTrace(what, depth));
};

const _toTrace = (what: any, depth: number) =>
    util.inspect(what, {
        showHidden: false,
        depth: (depth <= 0) ? null : depth
    });

const TEST_ORDER: Order = [
    [
        {
            orthography: { position: 0, text: 'auf etw. / einer Sache  folgen' },
            partOfSpeech: undefined,
            domain: [{ position: 23, text: 'geh.' }],
            extension: []
        },
        {
            orthography: { position: 0, text: 'nach etw. kommen' },
            partOfSpeech: { position: 17, text: 'vi' },
            domain: [],
            extension: [
                { position: 22, text: 'zeitlich oder örtlich anschließen' },
                { position: 58, text: 'Sache' }
            ]
        }
    ],
    [
        {
            orthography: { position: 0, text: 'folgend' },
            partOfSpeech: undefined,
            domain: [],
            extension: []
        },
        {
            orthography: { position: 0, text: 'nach kommend' },
            partOfSpeech: undefined,
            domain: [],
            extension: []
        }
    ],
    [
        {
            orthography: { position: 0, text: 'gefolgt' },
            partOfSpeech: undefined,
            domain: [],
            extension: []
        },
        {
            orthography: { position: 0, text: 'nach gekommen' },
            partOfSpeech: undefined,
            domain: [],
            extension: []
        }
    ],
    [
        {
            orthography: { position: 0, text: 'gefolgt werden von etw.' },
            partOfSpeech: undefined,
            domain: [],
            extension: []
        }
    ],
    [
        {
            orthography: { position: 0, text: 'Auf den Winter folgt der Frühling.' },
            partOfSpeech: undefined,
            domain: [],
            extension: []
        },
        {
            orthography: { position: 0, text: 'Dem Winter folgt der Frühling.' },
            partOfSpeech: undefined,
            domain: [{ position: 31, text: 'geh.' }],
            extension: []
        }
    ],
    [
        {
            orthography: { position: 0, text: 'Die Nummer 28 kommt nach 27.' },
            partOfSpeech: undefined,
            domain: [],
            extension: []
        }
    ],
    [
        {
            orthography: {
                position: 0,
                text: 'Zunächst gab es die Ansprachen der Ehrengäste, dann folgte die Preisverleihung.'
            },
            partOfSpeech: undefined,
            domain: [],
            extension: []
        }
    ],
    [
        {
            orthography: {
                position: 0,
                text: 'Der Krieg war zu Ende. Es folgte eine lange Zeit des Wiederaufbaus.'
            },
            partOfSpeech: undefined,
            domain: [],
            extension: []
        }
    ],
    [
        {
            orthography: {
                position: 0,
                text: 'Darauf folgt ein sechsmonatiges Praktikum.'
            },
            partOfSpeech: undefined,
            domain: [],
            extension: []
        }
    ]
];




suite('dingstructure', () => {

    function assertGenusEqual(f: Genus, expected: Genus, msg = "") {
        let parentMsg = msg.length > 0 ? `${msg} ` : '';
        assert.deepEqual(f, expected, parentMsg);
    }

    test('parse a simple genus', () => {
        let simpleLine = "Zaunkönig {m} (Troglodytes troglodytes) [ornith.]";
        let expected = {
            orthography: { text: "Zaunkönig", position: 0 },
            partOfSpeech: { position: 10, text: 'm' },
            domain: [{ position: 40, text: 'ornith.' }],
            extension: [
                { text: 'Troglodytes troglodytes', position: 14 }
            ]
        };
        let f = parseGenus(simpleLine);
        assertGenusEqual(f, expected);
    });

    test('parse genus with ( at begin', () => {
        let g = "(übertrieben) schwärmen";
        let expected = {
            orthography: { text: "schwärmen", position: 13 },
            domain: [],
            partOfSpeech: undefined,
            extension: [
                { position: 0, text: "übertrieben" }
            ]
        };
        let f = parseGenus(g);
        assertGenusEqual(f, expected);
    });

    function assertFamilyEqual(f: Family, expected: Family, msg = "") {
        let parentMsg = msg.length > 0 ? `${msg} ` : '';
        assert.equal(f.length, expected.length, `${parentMsg}`);
        for (let i = 0; i < f.length; ++i) {
            let fi = f[i], ei = expected[i];
            let m = `${parentMsg}Expected Genus[${i}] is equal to `;
            assertGenusEqual(fi, ei);
        }
    }

    test('parse family', () => {
        let l = "(durch die Luft) rauschen; (in der Luft) rascheln; surren {vi} ";
        let expected = [
            {
                orthography: { text: "rauschen", position: 16 },
                partOfSpeech: undefined,
                domain: [],
                extension: [
                    { position: 0, text: "durch die Luft" }
                ]
            },
            {
                orthography: { text: "rascheln", position: 13 },
                partOfSpeech: undefined,
                domain: [],
                extension: [
                    { position: 0, text: "in der Luft" }
                ]
            },
            {
                orthography: { text: "surren", position: 0 },
                partOfSpeech: { text: "vi", position: 7 },
                domain: [],
                extension: []
            }
        ];
        let f = parseFamily(l);
        assertFamilyEqual(f, expected);
    });

    test('other family', () => {
        let l = 'Schneeräumfahrzeug {n}; Räumfahrzeug {n} (Winterdienst) [auto]';
        let e = [
            {
                orthography: { text: "Schneeräumfahrzeug", position: 0 },
                partOfSpeech: { text: "n", position: 19 },
                domain: [],
                extension: []
            },
            {
                orthography: { text: "Räumfahrzeug", position: 0 },
                partOfSpeech: { text: "n", position: 13 },
                domain: [{ text: "auto", position: 32 }],
                extension: [
                    { position: 17, text: "Winterdienst" }
                ]
            },
        ];
        let f = parseFamily(l);
        assertFamilyEqual(f, e);
    });

    function assertOrderEqual(o: Order, e: Order) {
        for (let i = 0; i < o.length; ++i) {
            let fo = o[i], fe = e[i];
            assertFamilyEqual(fo, fe, `Expect family[${i}] equal to ${_toTrace(fe, 3)}`);
        }
    }

    test('parse order', () => {
        const l = "mauken; wintern {vi} | maukend; winternd | gemaukt; gewintert";
        const e: Order = [
            [
                {
                    orthography: { position: 0, text: 'mauken' },
                    partOfSpeech: undefined,
                    domain: [],
                    extension: []
                },
                {
                    orthography: { position: 0, text: 'wintern' },
                    partOfSpeech: { position: 8, text: 'vi' },
                    domain: [],
                    extension: []
                }
            ],
            [
                {
                    orthography: { position: 0, text: 'maukend' },
                    partOfSpeech: undefined,
                    domain: [],
                    extension: []
                },
                {
                    orthography: { position: 0, text: 'winternd' },
                    partOfSpeech: undefined,
                    domain: [],
                    extension: []
                }
            ],
            [
                {
                    orthography: { position: 0, text: 'gemaukt' },
                    partOfSpeech: undefined,
                    domain: [],
                    extension: []
                },
                {
                    orthography: { position: 0, text: 'gewintert' },
                    partOfSpeech: undefined,
                    domain: [],
                    extension: []
                }
            ]
        ];
        const o = parseOrder(l);
        assertOrderEqual(o, e);
    });

    test('parse long order', () => {
        const ml = ['auf etw. / einer Sache [geh.] folgen; nach etw. kommen {vi} (zeitlich oder örtlich anschließen) (Sache)',
            'folgend; nach kommend',
            'gefolgt; nach gekommen',
            'gefolgt werden von etw.',
            'Auf den Winter folgt der Frühling.; Dem Winter folgt der Frühling. [geh.]',
            'Die Nummer 28 kommt nach 27.',
            'Zunächst gab es die Ansprachen der Ehrengäste, dann folgte die Preisverleihung.',
            'Der Krieg war zu Ende. Es folgte eine lange Zeit des Wiederaufbaus.',
            'Darauf folgt ein sechsmonatiges Praktikum.'];
        const l = ml.join(' | ');
        const order = parseOrder(l);
        assertOrderEqual(order, TEST_ORDER);
    });

    test('format genus', () => {
        let g: Genus = {
            orthography: { text: "Räumfahrzeug", position: 0 },
            partOfSpeech: { text: "n", position: 13 },
            domain: [{ text: "auto", position: 32 }],
            extension: [
                { position: 17, text: "Winterdienst" }
            ]
        };
        let format = formatGenus(g);
        //console.log(format);
    });

    test('format order', () => {
        let de: Order = TEST_ORDER;
        let enText = [
            'to follow sth. (of a thing that comes after in time or place)',
            'following',
            'followed',
            'to be followed by sth.',
            'Spring follows winter.; Winter is followed by spring.',
            'The number 28 follows 27.',
            'First came the speeches of the guests of honour, and the presentation of awards followed.',
            'The war ended. There followed / Then came / Then there was a long period of rebuilding.',
            'This is followed by a six-month traineeship.'
        ].join(' | ');
        let en: Order = parseTranslate(enText);
        let card: DictCard = [de, en];
        let f = formatDictCard(card);
        //console.log(f);
    });

});



