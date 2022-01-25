import joplin from 'api'
import { ChangeEvent } from 'api/JoplinSettings'
import { SettingItem, SettingItemType } from 'api/types'

interface SettingItems {
    [key: string]: SettingItem,
}

export const SettingDefaults = {
    ui: 'kennedy',
    themeUi: { kennedy: "Kennedy (Default)", min: "Minimal (Small screens and mobile optimized)", atlas: "Atlas (Business oriented)"},
    languages: {
        id: 'Bahasa Indonesia',
        ms: 'Bahasa Melayu',
        bs: 'Bosanski',
        ca: 'Català',
        cs: 'Čeština',
        da: 'Dansk',
        de: 'Deutsch',
        et: 'Eesti',
        en: 'English',
        es: 'Español',
        fil: 'Filipino',
        fr: 'Français',
        it: 'Italiano',
        hu: 'Magyar',
        nl: 'Nederlands',
        no: 'Norsk',
        pl: 'Polski',
        'pt-br': 'Português (Brasil)',
        pt: 'Português (Portugal)',
        ro: 'Română',
        fi: 'Suomi',
        sv: 'Svenska',
        vi: 'Tiếng Việt',
        tr: 'Türkçe',
        el: 'Ελληνικά',
        ru: 'Русский',
        sr: 'Српски',
        uk: 'Українська',
        he: 'עברית',
        ar: 'العربية',
        th: 'ไทย',
        ko: '한국어',
        ja: '日本語',
        zh: '中文（中国）',
        'zh-tw': '中文（台灣）'
    },
}

export class Settings {

    // Settings definitions
    private _config: SettingItems = {
        themeUi: {
            value: 'en',
            type: SettingItemType.String,
            section: 'drawio.settings',
            public: true,
            advanced: false,
            isEnum: true,
            options: SettingDefaults.themeUi,
            label: 'Theme: UI',
            description: 'Control how the buttons and menu are rendered. https://www.diagrams.net/blog/diagram-editor-theme',
        },
        themeRough: {
            value: true,
            type: SettingItemType.Bool,
            section: 'drawio.settings',
            public: true,
            advanced: false,
            label: 'Theme: Rough style',
            description: 'Enable/disable the rough sketch style in the Sketch UI. https://www.diagrams.net/blog/rough-style.html',
        },
        themeDark: {
            value: false,
            type: SettingItemType.Bool,
            section: 'drawio.settings',
            public: true,
            advanced: false,
            label: 'Theme: Dark mode',
            description: 'Enable/disable the dark mode',
        },
        language: {
            value: Object.keys(SettingDefaults.languages)[0],
            type: SettingItemType.String,
            section: 'drawio.settings',
            public: true,
            advanced: false,
            isEnum: true,
            options: SettingDefaults.languages,
            label: 'Theme: Language',
            description: 'Set the editor language',
        },
        grid: {
            value: true,
            type: SettingItemType.Bool,
            section: 'drawio.settings',
            public: true,
            advanced: false,
            label: 'View: Grid',
            description: 'Enable/disable the grid',
        },
        pageVisible: {
            value: true,
            type: SettingItemType.Bool,
            section: 'drawio.settings',
            public: true,
            advanced: false,
            label: 'View: Page visible',
            description: 'Show/hide the boundaries of a page',
        },
        ruler: {
            value: false,
            type: SettingItemType.Bool,
            section: 'drawio.settings',
            public: true,
            advanced: false,
            label: 'View: Ruler',
            description: 'Show/hide rulers',
        },
    }

    // Checks on the settings
    private _checks = {
    }

    // Getters
    get(key: string): any {
        if (key in this._config) {
            return this._config[key].value
        }
        throw 'Setting not found: ' + key
    }
    toObject(): any {
        return Object.keys(this._config).reduce((result, key) => {
            result[key] = this._config[key].value
            return result
        }, {})
    }

    // Register settings
    async register() {
        await joplin.settings.registerSection('drawio.settings', {
            label: 'Draw.io',
            iconName: 'fa fa-project-diagram',
            description: 'Drawio allows you to render and modify diagrams created with draw.io (aka diagrams.net). For more info on the plugin: https://github.com/marc0l92/joplin-plugin-drawio#readme',
        })

        await joplin.settings.registerSettings(this._config)

        // Initially read settings
        await this.read()
    }

    // Get setting on change
    private async getOrDefault(event: ChangeEvent, localVar: any, setting: string): Promise<any> {
        if (!event || event.keys.includes(setting)) {
            return await joplin.settings.value(setting)
        }
        return localVar
    }

    // Store settings on change
    async read(event?: ChangeEvent) {
        for (let key in this._config) {
            this._config[key].value = await this.getOrDefault(event, this._config[key].value, key)
            if (key in this._checks) {
                this._config[key].value = this._checks[key](this._config[key].value)
                await joplin.settings.setValue(key, this._config[key].value)
            }
        }
    }
}
