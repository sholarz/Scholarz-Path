// Temporary type shims to keep editor diagnostics usable when React typings
// are unavailable in this workspace. Remove after @types/react installs cleanly.

declare module "react";
declare module "react/jsx-runtime";

declare namespace JSX {
    interface IntrinsicElements {
        [elemName: string]: any;
    }
}
