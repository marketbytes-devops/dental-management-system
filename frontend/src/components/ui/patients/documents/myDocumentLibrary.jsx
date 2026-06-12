export default function MyDocumentLibrary({ documents = [] }) {
  const getFileIcon = (type) => {
    switch (type) {
      case "X-Ray":
        return "💀";
      case "Lab Report":
        return "🧪";
      case "Consent Form":
        return "📄";
      default:
        return "📁";
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-900">Clinical Document Library</h3>
      {documents.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          No files available in your medical record folder.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between hover:border-primary/20 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-lg border border-gray-100">
                  {getFileIcon(doc.type)}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 line-clamp-1">{doc.name}</h4>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400 font-medium">
                    <span>{doc.type}</span>
                    <span>·</span>
                    <span>{doc.size}</span>
                    <span>·</span>
                    <span>{doc.date}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {doc.type === "Consent Form" && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      doc.signed
                        ? "bg-success/10 text-success"
                        : "bg-warning/10 text-warning-800"
                    }`}
                  >
                    {doc.signed ? "Signed" : "Unsigned"}
                  </span>
                )}
                <a
                  href={doc.url}
                  onClick={(e) => {
                    e.preventDefault();
                    alert(`Downloading "${doc.name}" is not supported in the mock version.`);
                  }}
                  className="p-2 text-gray-400 hover:text-primary transition-colors text-xs font-semibold hover:bg-gray-50 rounded-lg border border-gray-150"
                  title="Download File"
                >
                  📥 Download
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
