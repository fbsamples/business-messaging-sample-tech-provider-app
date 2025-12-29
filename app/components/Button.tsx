// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.


"use client"

export function Button({ href = "", title, subtitle = null, onClick = () => { } }) {
    return (
        <>
            <div onClick={onClick} className="mb-8 grid text-center cursor-pointer" >
                <a
                    href={href}
                    className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 dark:hover:border-neutral-700 dark:hover:bg-neutral-800/30"
                    target="_blank"
                    rel=""
                >
                    <h2 className={`mb-3 text-lg font-semibold`}>
                        {title}
                        <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                            -&gt;
                        </span>
                    </h2>
                    <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
                        {subtitle}
                    </p>
                </a>
            </div >
        </>
    );
}


export default function ButtonInner({ href = "", title, subtitle = null, onClick = () => { } }) {

    const subtitleComponent = subtitle ? (
        <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            {subtitle}
        </p>
    ) : null;

    return (
        <>
            <div onClick={onClick} className="mb-0 grid text-center cursor-pointer" >
                <a
                    href={href}
                    className="group rounded-lg border border-transparent px-4 py-1 transition-colors hover:border-gray-300 hover:bg-gray-100"
                    target="_blank"
                    rel=""
                >
                    <h2 className={`mb-0 text-base font-semibold`}>
                        {title}
                        <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                            -&gt;
                        </span>

                    </h2>
                    {subtitleComponent}
                </a>
            </div >
        </>
    );
} 