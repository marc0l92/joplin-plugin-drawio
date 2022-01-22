import joplin from 'api'
import { ChangeEvent } from 'api/JoplinSettings'
import { SettingItem, SettingItemType } from 'api/types'

interface SettingItems {
    [key: string]: SettingItem,
}

export const SettingDefaults = {
    ui: 'kennedy',
    themeUi: { kennedy: "Kennedy (default)", min: "Minimal", atlas: "Atlas", dark: "Dark", sketch: "Sketch" },
}

export class Settings {

    // Settings definitions
    private _config: SettingItems = {
        themeUi: {
            value: Object.keys(SettingDefaults.themeUi)[0],
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
            value: false,
            type: SettingItemType.Bool,
            section: 'drawio.settings',
            public: true,
            advanced: false,
            label: 'Theme: Rough style',
            description: 'Enable/disable the rough sketch style. https://www.diagrams.net/blog/rough-style.html',
        },
        themeDark: {
            value: false,
            type: SettingItemType.Bool,
            section: 'drawio.settings',
            public: true,
            advanced: false,
            label: 'Theme: Dark mode',
            description: 'Enable/disable the dark mode only available in Sketch and Minimal UI',
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
