import { FileImage, FlaskConical, FileSignature, Folder, Download } from "lucide-react";

export default function MyDocumentLibrary({ documents = [] }) {
  const getFileIcon = (type) => {
    switch (type) {
      case "X-Ray":
        return <FileImage className="w-5 h-5 text-gray-500" />;
      case "Lab Report":
        return <FlaskConical className="w-5 h-5 text-gray-500" />;
      case "Consent Form":
        return <FileSignature className="w-5 h-5 text-gray-500" />;
      default:
        return <Folder className="w-5 h-5 text-gray-500" />;
    }
  };

  // Group documents by type
  const groupedDocs = documents.reduce((acc, doc) => {
    if (!acc[doc.type]) acc[doc.type] = [];
    acc[doc.type].push(doc);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-gray-900">Clinical Document Library</h3>
      {documents.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          No files available in your medical record folder.
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedDocs).map(([type, docs]) => (
            <div key={type} className="space-y-3">
              <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2">
                {getFileIcon(type)}
                {type}s
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {docs.map((doc) => (
                  <div
                    key={doc.id}
                    className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between hover:border-primary/20 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100">
                        {getFileIcon(doc.type)}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-800 line-clamp-1">{doc.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400 font-medium">
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
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 p-2 text-gray-400 hover:text-primary transition-colors text-xs font-semibold hover:bg-gray-50 rounded-lg border border-gray-150 cursor-pointer"
                        title="Download File"
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
