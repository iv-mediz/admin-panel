/** Circular outline + person silhouette (empty image slot). */
export default function ImageUploadPlaceholder({
  size = 96,
  caption,
}: {
  size?: number
  caption?: string
}) {
  return (
    <span className="image-upload-placeholder">
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        aria-hidden
        className="image-upload-placeholder-svg"
      >
        <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="50" cy="38" r="11" fill="none" stroke="currentColor" strokeWidth="2.5" />
        <path
          d="M28 78c0-12 10-22 22-22s22 10 22 22"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      {caption ? <span className="image-upload-placeholder-caption">{caption}</span> : null}
    </span>
  )
}
