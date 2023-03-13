/* *
 *
 *  (c) 2009 - 2023 Highsoft AS
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 *  Authors:
 *  - Sebastian Bochan
 *  - Wojciech Chmiel
 *  - Gøran Slettemark
 *  - Sophie Bremer
 *  - Pawel Lysy
 *  - Karol Kolodziej
 *
 * */

'use strict';

/* *
 *
 *  Imports
 *
 * */

import type JSON from '../Core/JSON';

import Bindings from './Actions/Bindings.js';
import DashboardsAccessibility from './Accessibility/DashboardsAccessibility.js';
import DataCursor from '../Data/DataCursor.js';
import DataCursorHelper from './SerializeHelper/DataCursorHelper.js';
import EditMode from './EditMode/EditMode.js';
import Fullscreen from './EditMode/Fullscreen.js';
import Globals from './Globals.js';
import Layout from './Layout/Layout.js';
import Serializable from './Serializable.js';
import U from '../Core/Utilities.js';
const {
    merge,
    addEvent,
    error,
    objectEach,
    uniqueKey,
    createElement
} = U;

/* *
 *
 *  Class
 *
 * */

/**
 * Class that represents a dashboard.
 *
 */
class Board implements Serializable<Board, Board.JSON> {

    /* *
     *
     *  Constructor
     *
     * */

    /**
     * Creates a dashboard with components like charts, tables, and HTML
     * elements.
     *
     * @param renderTo
     * The DOM element to render to, or its id.
     *
     * @param options
     * The options for the dashboard.
     */
    public constructor(
        renderTo: (string|HTMLElement),
        options: Board.Options
    ) {
        this.options = merge(Board.defaultOptions, options);
        this.layouts = [];
        this.guiEnabled = (this.options.gui || {}).enabled;
        this.mountedComponents = [];
        this.id = uniqueKey();

        this.initContainer(renderTo);

        // Create layouts wrapper.
        this.layoutsWrapper = createElement(
            'div', {
                className: Globals.classNames.layoutsWrapper
            }, {},
            this.container
        );

        // Init edit mode.
        if (
            EditMode && !(
                this.options.editMode &&
                !this.options.editMode.enabled
            )
        ) {
            this.editMode = new EditMode(this, this.options.editMode);
        }

        // Init layouts from options.
        if (options.gui && this.options.gui) {
            this.setLayouts(this.options.gui);
        }

        // Init layouts from JSON.
        if (options.layoutsJSON && !this.layouts.length) {
            this.setLayoutsFromJSON(options.layoutsJSON);
        }

        // Init components from options.
        if (options.components) {
            this.setComponents(options.components);
        }

        // Init events.
        this.initEvents();

        // Add table cursors support.
        this.cursor = new DataCursor();

        // Add fullscreen support.
        this.fullscreen = new Fullscreen(this);

        this.index = Globals.boards.length;
        Globals.boards.push(this);

        // a11y module
        this.a11y = new DashboardsAccessibility(this);
    }

    /* *
     *
     *  Static Functions
     *
     * */

    /**
     * Factory function for creating a new dashboard.
     *
     * @param renderTo
     * The DOM element to render to, or its id.
     *
     * @param options
     * The options for the dashboard.
     */
    public static board(
        renderTo: (string|globalThis.HTMLElement),
        options: Board.Options
    ): Board {
        return new Board(renderTo, options);
    }

    /* *
     *
     *  Properties
     *
     * */

    /**
     * The accessibility module for the dashboard.
     * @internal
     * */
    public a11y: DashboardsAccessibility;

    /**
     * The container referenced by the `renderTo` option when creating the
     * dashboard.
     * @internal
     * */
    public boardWrapper: HTMLElement = void 0 as any;

    /**
     * The main container for the dashboard. Created inside the element
     * specified by user when creating the dashboard.
     * */
    public container: HTMLElement = void 0 as any;

    /**
     * The data cursor instance used for interacting with the data.
     * @internal
     * */
    public cursor: DataCursor;

    /**
     * The edit mode instance. Used to handle editing the dashboard.
     * */
    public editMode?: EditMode;

    /**
     * The fullscreen instance. Controls the fullscreen mode.
     * */
    public fullscreen?: Fullscreen;

    /**
     * Flag to determine if the GUI is enabled.
     * @internal
     * */
    public guiEnabled: (boolean|undefined);

    /**
     * The unique id of the dashboard, it is generated automatically.
     * */
    public readonly id: string;

    /**
     * Index of the board in the global boards array. Allows to access the
     * specific one when having multiple dashboards.
     * */
    public readonly index: number;

    /**
     * An array of generated layouts.
     * */
    public layouts: Array<Layout>;

    /**
     * The wrapper for the layouts.
     * @internal
     * */
    public layoutsWrapper: globalThis.HTMLElement;

    /**
     * An array of mounted components on the dashboard.
     * */
    public mountedComponents: Array<Bindings.MountedComponentsOptions>;

    /**
     * The options for the dashboard.
     * */
    public options: Board.Options;

    /* *
     *
     *  Functions
     *
     * */

    /**
     * Initializes the events.
     * @internal
     */
    private initEvents(): void {
        const board = this;

        addEvent(window, 'resize', function (): void {
            board.reflow();
        });
    }

    /**
     * Initialize the container for the dashboard.
     * @internal
     *
     * @param renderTo
     * The DOM element to render to, or its id.
     */
    private initContainer(renderTo: (string|HTMLElement)): void {
        const board = this;

        if (typeof renderTo === 'string') {
            renderTo = window.document.getElementById(renderTo) as HTMLElement;
        }

        // Display an error if the renderTo doesn't exist.
        if (!renderTo) {
            error(13, true);
        }

        // Clear the container from any content.
        renderTo.innerHTML = '';

        // Set the main wrapper container.
        board.boardWrapper = renderTo;

        // Add container for the board.
        board.container = createElement(
            'div', {
                className: Globals.classNames.boardContainer
            }, {},
            this.boardWrapper
        );
    }

    /**
     * Creates a new layouts and adds it to the dashboard based on the options.
     * @internal
     *
     * @param guiOptions
     * The GUI options for the layout.
     *
     */
    private setLayouts(guiOptions: Board.GUIOptions): void {
        const board = this,
            layoutsOptions = guiOptions.layouts;

        for (let i = 0, iEnd = layoutsOptions.length; i < iEnd; ++i) {
            board.layouts.push(
                new Layout(
                    board,
                    merge({}, guiOptions.layoutOptions, layoutsOptions[i])
                )
            );
        }
    }

    /**
     * Set the layouts from JSON.
     * @internal
     *
     * @param json
     * An array of layout JSON objects.
     *
     */
    private setLayoutsFromJSON(json: Array<Layout.JSON>): void {
        const board = this;

        let layout;

        for (let i = 0, iEnd = json.length; i < iEnd; ++i) {
            layout = Layout.fromJSON(json[i], board);

            if (layout) {
                board.layouts.push(layout);
            }
        }
    }

    /**
     * Set the components from options.
     * @internal
     *
     * @param components
     * An array of component options.
     *
     */
    private setComponents(
        components: Array<Bindings.ComponentOptions>
    ): void {
        for (let i = 0, iEnd = components.length; i < iEnd; ++i) {
            Bindings.addComponent(components[i]);
        }
    }

    /**
     * Returns the current size of the layout container based on the selected
     * responsive breakpoints.
     * @internal
     *
     * @returns Return current size of the layout container in px.
     */
    public getLayoutContainerSize(): string {
        const board = this,
            responsiveOptions = board.options.responsiveBreakpoints,
            cntWidth = (board.layoutsWrapper || {}).clientWidth;

        let size = Globals.responsiveBreakpoints.large;

        if (responsiveOptions) {
            if (cntWidth <= responsiveOptions.small) {
                size = Globals.responsiveBreakpoints.small;
            } else if (
                cntWidth > responsiveOptions.small &&
                cntWidth <= responsiveOptions.medium
            ) {
                size = Globals.responsiveBreakpoints.medium;
            }
        }

        return size;
    }

    /**
     * Destroy the whole dashboard, its layouts and elements.
     */
    public destroy(): void {
        const board = this;

        // Destroy layouts.
        for (let i = 0, iEnd = board.layouts.length; i < iEnd; ++i) {
            board.layouts[i].destroy();
        }

        // Destroy container.
        board.container.remove();

        // @ToDo Destroy bindings.

        // Delete all properties.
        objectEach(board, function (val: unknown, key: string): void {
            delete (board as Record<string, any>)[key];
        });

        Globals.boards[this.index] = void 0;

        return;
    }

    /**
     * Export layouts to the local storage.
     */
    public exportLocal(): void {
        localStorage.setItem(
            // Dashboard.prefix + this.id,
            Globals.classNamePrefix + '1', // temporary for demo test
            JSON.stringify(this.toJSON())
        );
    }

    /**
     * Import the dashboard's layouts from the local storage.
     *
     * @param id
     * The id of the layout to import.
     *
     * @returns Returns the imported layout.
     */
    public importLayoutLocal(id: string): Layout|undefined {
        return Layout.importLocal(id, this);
    }

    /**
     * Reflow the dashboard. Hide the toolbars and context pointer. Reflow the
     * layouts and its cells.
     */
    public reflow(): void {
        const board = this,
            cntSize = board.getLayoutContainerSize();

        let layout, row, cell;

        if (board.editMode) {
            board.editMode.hideToolbars(['cell', 'row']);
            board.editMode.hideContextPointer();
        }

        for (let i = 0, iEnd = board.layouts.length; i < iEnd; ++i) {
            layout = board.layouts[i];

            for (let j = 0, jEnd = layout.rows.length; j < jEnd; ++j) {
                row = layout.rows[j];

                for (let k = 0, kEnd = row.cells.length; k < kEnd; ++k) {
                    cell = row.cells[k];
                    cell.reflow(cntSize);
                }
            }
        }
    }

    /**
     * Converts the given JSON to a class instance.
     *
     * @param json
     * JSON to deserialize as a class instance or object.
     *
     * @returns Returns the class instance or object.
     */
    public fromJSON(
        json: Board.JSON
    ): Board {
        const options = json.options,
            board = new Board(
                options.containerId,
                {
                    layoutsJSON: options.layouts,
                    componentOptions: options.componentOptions,
                    responsiveBreakpoints: options.responsiveBreakpoints
                }
            );

        board.cursor = DataCursorHelper.fromJSON(json.cursor);

        return board;
    }

    /**
     * Converts the class instance to a class JSON.
     *
     * @returns Class JSON of this Dashboard instance.
     */
    public toJSON(): Board.JSON {
        const board = this,
            layouts = [];

        // Get layouts JSON.
        for (let i = 0, iEnd = board.layouts.length; i < iEnd; ++i) {
            layouts.push(board.layouts[i].toJSON());
        }

        return {
            $class: 'Board',
            cursor: DataCursorHelper.toJSON(board.cursor),
            options: {
                containerId: board.container.id,
                guiEnabled: board.guiEnabled,
                layouts: layouts,
                componentOptions: board.options.componentOptions,
                responsiveBreakpoints: board.options.responsiveBreakpoints
            }
        };
    }

}

/* *
 *
 *  Class Namespace
 *
 * */

namespace Board {

    /* *
     *
     *  Declarations
     *
     * */

    /**
     * Options to configure the board.
     **/
    export interface Options {
        /**
         * Options for the GUI. Allows to define graphical elements and its
         * layout.
         **/
        gui?: GUIOptions;
        /**
         * Options for the edit mode. Can be used to enable the edit mode and
         * define all things related to it like the context menu.
         **/
        editMode?: EditMode.Options;
        /**
         * List of components to add to the board.
         **/
        components?: Array<Bindings.ComponentOptions>;
        /**
         * General options for the components.
         **/
        componentOptions?: Partial<Bindings.ComponentOptions>;
        /**
         * A list of serialized layouts to add to the board.
         **/
        layoutsJSON?: Array<Layout.JSON>;
        /**
         * Responsive breakpoints for the board - small, medium and large.
         **/
        responsiveBreakpoints?: ResponsiveBreakpoints;
    }

    /**
     * Serialized options to configure the board.
     **/
    export interface OptionsJSON extends JSON.Object {
        /**
         * Id of the container to which the board is added.
         **/
        containerId: string;
        /**
         * An array of serialized layouts options and their elements to add to
         * the board.
         **/
        layouts: Array<Layout.JSON>;
        /**
         * Whether the GUI is enabled or not.
         **/
        guiEnabled?: boolean;
        /**
         * General options for the components.
         **/
        componentOptions?: Partial<Bindings.ComponentOptions>;
        /**
         * Responsive breakpoints for the board - small, medium and large.
         **/
        responsiveBreakpoints?: ResponsiveBreakpoints;
    }

    /**
     * Responsive breakpoints for the board - small, medium and large.
     **/
    export interface ResponsiveBreakpoints extends JSON.Object {
        /**
         * Value in px to test the dashboard is in small mode.
         **/
        small: number;
        /**
         * Value in px to test the dashboard is in medium mode.
         **/
        medium: number;
        /**
         * Value in px to test the dashboard is in large mode.
         **/
        large: number;
    }

    export interface GUIOptions {
        /**
         * Whether the GUI is enabled or not.
         *
         * @default true
         **/
        enabled: boolean;
        /**
         * Options for the layouts.
         **/
        layoutOptions: Partial<Layout.Options>;
        /**
         * A list of layouts and their elements options to add to the board.
         **/
        layouts: Array<Layout.Options>;
    }

    /** @internal */
    export interface JSON extends Serializable.JSON<'Board'> {
        /**
         * Serialized options to configure the board.
         **/
        options: OptionsJSON;
        /**
         * Serialized cursor of the board.
         **/
        cursor: DataCursorHelper.JSON;
    }

    /* *
     *
     *  Constants
     *
     * */

    /**
     * Global dashboard settings.
     * @internal
     *
     */
    export const defaultOptions: Board.Options = {
        gui: {
            enabled: true,
            layoutOptions: {
                rowClassName: void 0,
                cellClassName: void 0
            },
            layouts: []
        },
        componentOptions: {
            isResizable: true
        },
        components: [],
        responsiveBreakpoints: {
            small: 576,
            medium: 992,
            large: 1200
        }
    };


    /* *
     *
     *  Functions
     *
     * */

    /**
     * Import layouts from the local storage.
     *
     * @returns Returns the Dashboard instance or undefined.
     */
    export function importLocal(): (Board|undefined) {
        const dashboardJSON = localStorage.getItem(
            // Dashboard.prefix + this.id,
            Globals.classNamePrefix + '1' // temporary for demo test
        );

        if (dashboardJSON) {
            try {
                return Serializable
                    .fromJSON(JSON.parse(dashboardJSON)) as Board;
            } catch (e) {
                // nothing to do
            }
        }
    }

}

/* *
 *
 *  Registry
 *
 * */

Serializable.registerClassPrototype('Board', Board.prototype);

/* *
 *
 *  Default Export
 *
 * */

export default Board;
