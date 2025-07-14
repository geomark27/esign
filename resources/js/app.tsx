import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';

createInertiaApp({
    title: (title) => {
        const currentTitle = document.querySelector('title')?.innerText ?? 'Laravel';
        const parts = currentTitle.split(' - ');
        const appName = parts.length > 1 ? parts[parts.length - 1] : currentTitle;

        return title ? `${title} - ${appName}` : appName;
    },
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(<App {...props} />);
    },
});

initializeTheme();