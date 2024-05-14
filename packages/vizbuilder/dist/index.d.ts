import { ViewProps } from '@datawheel/tesseract-explorer';
import { VizbuilderProps } from '@datawheel/vizbuilder';
import React from 'react';

/**
 * Main Vizbuilder component wrapper.
 */
declare function VizbuilderView(props: ViewProps & Omit<VizbuilderProps, "queries"> & {
    formatters: Record<string, (value: number) => string>;
}): React.JSX.Element;
declare namespace VizbuilderView {
    var defaultProps: {
        version: string | undefined;
    };
}

export { VizbuilderView, VizbuilderView as default };
