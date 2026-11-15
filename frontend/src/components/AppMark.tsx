/**
 * The Vitaena mark: a CV page with its person and lines cut out, so whatever is behind it
 * shows through and it sits on a light or a dark title bar alike.
 *
 * The same shape as build/icon-src/tray-mac.svg. The app icon itself is build/appicon.svg.
 */

export function AppMark({size = 18, className}: {size?: number; className?: string}) {
    return (
        <svg className={className} width={size} height={size} viewBox="0 0 22 22" aria-hidden="true" focusable="false">
            <path
                fillRule="evenodd"
                fill="var(--brand-teal)"
                d="M8 2H16.5Q18.5 2 18.5 4V18Q18.5 20 16.5 20H5.5Q3.5 20 3.5 18V6.5ZM11 5A2 2 0 1 0 11 9A2 2 0 1 0 11 5ZM7.8 13H14.2V12.3Q14.2 10.2 12.2 10.2H9.8Q7.8 10.2 7.8 12.3ZM6.5 14.5V16H15.5V14.5Z"
            />
        </svg>
    )
}
