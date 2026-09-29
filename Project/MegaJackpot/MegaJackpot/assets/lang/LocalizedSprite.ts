import { ELang } from "./langEnum";

/**
 * Replaces SpriteFrames for the image language pack in resources/NewPng/Language.
 *
 * A localized image node is identified by its name. For example, the node named
 * `lage_35` loads `NewPng/Language/<language>/lage_35`. Keep the same file name
 * in every language directory; no UUID needs to be maintained in scene files.
 */
export class LocalizedSprite {
    private static readonly DEFAULT_LANGUAGE = "en";
    private static readonly RESOURCE_ROOT = "NewPng/Language";
    private static readonly NODE_NAME_PREFIX = "lage_";
    private static readonly LANGUAGE_FOLDERS: { [language: string]: string } = {
        id: "idn",
        pt: "ptbr",
        tr: "tur",
    };
    private static refreshVersion = 0;

    /** Refresh all localized image nodes in the active scene. */
    public static refresh(language?: number | string): void {
        const version = ++this.refreshVersion;
        const languageFolder = this.resolveLanguageFolder(language);
        const scene = cc.director.getScene();

        if (!scene) {
            console.warn("[LocalizedSprite] Cannot refresh images before the scene is available.");
            return;
        }

        this.collectLocalizedSprites(scene).forEach(sprite => {
            this.loadSpriteFrame(languageFolder, sprite.node.name, (spriteFrame) => {
                // Ignore an older asynchronous request after the language has changed.
                if (version === this.refreshVersion && cc.isValid(sprite.node)) {
                    sprite.spriteFrame = spriteFrame;
                }
            });
        });
    }

    /** Refresh one localized image node without reloading every scene image. */
    public static refreshSprite(sprite: cc.Sprite, language?: number | string): void {
        if (!sprite || !cc.isValid(sprite.node)) {
            return;
        }

        const version = this.refreshVersion;
        const languageFolder = this.resolveLanguageFolder(language);
        this.loadSpriteFrame(languageFolder, sprite.node.name, (spriteFrame) => {
            if (version === this.refreshVersion && cc.isValid(sprite.node)) {
                sprite.spriteFrame = spriteFrame;
            }
        });
    }

    private static collectLocalizedSprites(node: cc.Node, sprites: cc.Sprite[] = []): cc.Sprite[] {
        const sprite = node.getComponent(cc.Sprite);
        if (sprite && node.name.indexOf(this.NODE_NAME_PREFIX) === 0) {
            sprites.push(sprite);
        }

        node.children.forEach(child => this.collectLocalizedSprites(child, sprites));
        return sprites;
    }

    private static resolveLanguageFolder(language?: number | string): string {
        let languageCode: string;
        if (typeof language === "number") {
            languageCode = ELang[language] || this.DEFAULT_LANGUAGE;
        } else {
            languageCode = language || ((<any>window).user && (<any>window).user.lang) || this.DEFAULT_LANGUAGE;
        }

        languageCode = String(languageCode).toLowerCase().replace(/_/g, "-").split("-")[0];
        return this.LANGUAGE_FOLDERS[languageCode] || languageCode || this.DEFAULT_LANGUAGE;
    }

    private static loadSpriteFrame(languageFolder: string, imageName: string, done: (frame: cc.SpriteFrame) => void): void {
        this.load(`${this.RESOURCE_ROOT}/${languageFolder}/${imageName}`, (err, frame) => {
            if (!err && frame) {
                done(frame);
                return;
            }

            if (languageFolder === this.DEFAULT_LANGUAGE) {
                console.warn(`[LocalizedSprite] English fallback is missing: ${imageName}`, err);
                return;
            }

            // A language pack can be incomplete; English is always the final fallback.
            this.load(`${this.RESOURCE_ROOT}/${this.DEFAULT_LANGUAGE}/${imageName}`, (fallbackErr, fallbackFrame) => {
                if (fallbackErr || !fallbackFrame) {
                    console.warn(`[LocalizedSprite] Image is missing for ${languageFolder} and English: ${imageName}`, fallbackErr || err);
                    return;
                }
                done(fallbackFrame);
            });
        });
    }

    private static load(path: string, done: (err: Error, frame: cc.SpriteFrame) => void): void {
        cc.resources.load(path, cc.SpriteFrame, done);
    }
}
