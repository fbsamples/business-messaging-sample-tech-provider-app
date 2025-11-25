'use client';

export default function Copyable({ text_to_copy, children }) {

    const copy = (text_to_copy) => {
        navigator.clipboard.writeText(text_to_copy)
    };

    return (
        <div onClick={() => copy(text_to_copy)} >
            {children}
        </div>
    )
}
