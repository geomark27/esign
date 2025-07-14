import{u as y,j as e,L as m}from"./app-DBjPCby5.js";import{c as a,a as r}from"./app-logo-icon-CY81C8uy.js";import{S as g,H as h}from"./layout-BMTpGIlI.js";import{A as x}from"./app-layout-vFpeM5g7.js";import"./separator-C-bUnQ13.js";import"./index-IzzgUo17.js";import"./index-B6rgA-WC.js";/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const u=[["rect",{width:"20",height:"14",x:"2",y:"3",rx:"2",key:"48i651"}],["line",{x1:"8",x2:"16",y1:"21",y2:"21",key:"1svkeh"}],["line",{x1:"12",x2:"12",y1:"17",y2:"21",key:"vw1qmm"}]],k=a("Monitor",u);/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const b=[["path",{d:"M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z",key:"a7tn18"}]],f=a("Moon",b);/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const j=[["circle",{cx:"12",cy:"12",r:"4",key:"4exip2"}],["path",{d:"M12 2v2",key:"tus03m"}],["path",{d:"M12 20v2",key:"1lh1kg"}],["path",{d:"m4.93 4.93 1.41 1.41",key:"149t6j"}],["path",{d:"m17.66 17.66 1.41 1.41",key:"ptbguv"}],["path",{d:"M2 12h2",key:"1t8f8n"}],["path",{d:"M20 12h2",key:"1q8mjw"}],["path",{d:"m6.34 17.66-1.41 1.41",key:"1m8zz5"}],["path",{d:"m19.07 4.93-1.41 1.41",key:"1shlcs"}]],v=a("Sun",j);function w({className:n="",...s}){const{appearance:i,updateAppearance:o}=y(),c=[{value:"light",icon:v,label:"Light"},{value:"dark",icon:f,label:"Dark"},{value:"system",icon:k,label:"System"}];return e.jsx("div",{className:r("inline-flex w-full max-w-md overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800",n),...s,children:c.map(({value:t,icon:p,label:d})=>{const l=i===t;return e.jsxs("button",{onClick:()=>o(t),className:r("flex-1 flex flex-col items-center justify-center gap-1 py-2 px-4 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",l?"bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white":"text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700"),children:[e.jsx("span",{children:d}),e.jsx(p,{className:"h-5 w-5"})]},t)})})}const A=[{title:"Appearance settings",href:"/settings/appearance"}];function H(){return e.jsxs(x,{breadcrumbs:A,children:[e.jsx(m,{title:"Appearance settings"}),e.jsx(g,{children:e.jsxs("div",{className:"space-y-6",children:[e.jsx(h,{title:"Appearance settings",description:"Update your account's appearance settings"}),e.jsx(w,{})]})})]})}export{H as default};
