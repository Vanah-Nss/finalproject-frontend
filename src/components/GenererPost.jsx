import { useState, useRef, useEffect } from "react";
import { gql, useMutation } from "@apollo/client";
import {
  FiCheckCircle,
  FiXCircle,
  FiUpload,
  FiBold,
  FiItalic,
  FiUnderline,
  FiList,
} from "react-icons/fi";
import { FaLinkedin } from "react-icons/fa";
import ReCAPTCHA from "react-google-recaptcha";

const CREATE_POST = gql`
  mutation CreatePost($content: String!, $imageUrl: String, $scheduledAt: String, $recaptchaToken: String!) {
    createPost(content: $content, imageUrl: $imageUrl, scheduledAt: $scheduledAt, recaptchaToken: $recaptchaToken) {
      success
      message
      post { id content status imageUrl createdAt scheduledAt }
    }
  }
`;

const GENERATE_POST = gql`
  mutation GeneratePost($theme: String!, $tone: String, $length: String, $imageUrl: String, $scheduledAt: String, $recaptchaToken: String!) {
    generatePost(theme: $theme, tone: $tone, length: $length, imageUrl: $imageUrl, scheduledAt: $scheduledAt, recaptchaToken: $recaptchaToken) {
      success
      message
      post { id content status imageUrl createdAt scheduledAt }
    }
  }
`;

const PUBLISH_POST = gql`
  mutation PublishPost($id: Int!) {
    publishPost(id: $id) {
      post { id content status imageUrl scheduledAt }
    }
  }
`;

const GENERATE_IMAGE = gql`
  mutation GenerateImage($prompt: String!, $recaptchaToken: String!) {
    generateImage(prompt: $prompt, recaptchaToken: $recaptchaToken) {
      success
      message
      imageUrl
    }
  }
`;

function Toast({ message, type, onClose }) {
  const styles = type === "success" ? "bg-white border-l-4 border-emerald-500 text-gray-800" : "bg-white border-l-4 border-rose-500 text-gray-800";
  return (
    <div className={`flex items-center gap-3 px-6 py-4 rounded-lg shadow-2xl ${styles} mb-3`}>
      {type === "success" ? <FiCheckCircle size={22} className="text-emerald-500" /> : <FiXCircle size={22} className="text-rose-500" />}
      <span className="flex-1 font-medium">{message}</span>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold text-lg">✕</button>
    </div>
  );
}

function ImageGenerator({ setImageUrl, getValidToken, addToast }) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const [generateImageMutation] = useMutation(GENERATE_IMAGE, {
    onCompleted: (data) => {
      setLoading(false);
      if (data.generateImage.success) {
        setImageUrl(data.generateImage.imageUrl);
        addToast("✨ Image générée avec succès !", "success");
      } else {
        addToast(`❌ ${data.generateImage.message}`, "error");
      }
    },
    onError: (err) => {
      setLoading(false);
      addToast("❌ Erreur lors de la génération de l'image.", "error");
    },
  });

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      addToast("⚠️ Entre un prompt pour générer l'image !", "error");
      return;
    }
    setLoading(true);
    const token = await getValidToken();
    if (!token) {
      setLoading(false);
      return;
    }
    await generateImageMutation({ variables: { prompt, recaptchaToken: token } });
  };

  return (
    <div className="flex flex-col gap-4">
      <input
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Tape ton prompt ici (ex: une plage au coucher du soleil)"
        className="border border-gray-300 p-3 rounded-2xl shadow-sm w-full focus:ring-2 focus:ring-blue-900"
      />
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="bg-blue-900 text-white px-5 py-3 rounded-xl hover:bg-blue-950 shadow-md font-semibold disabled:opacity-50"
      >
        {loading ? "⏳ Génération en cours..." : "✨ Générer l'image"}
      </button>
    </div>
  );
}

export default function GenererPost() {
  const recaptchaRef = useRef(null);
  const editorRef = useRef(null);
  const [recaptchaToken, setRecaptchaToken] = useState("");
  const [isRecaptchaValidated, setIsRecaptchaValidated] = useState(false);
  const [useAIContent, setUseAIContent] = useState(true);
  const [useAI, setUseAI] = useState(true);
  const [theme, setTheme] = useState("");
  const [tone, setTone] = useState("");
  const [length, setLength] = useState("court");
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [postsHistory, setPostsHistory] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scheduled, setScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");

  const addToast = (message, type) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  const onRecaptchaChange = (token) => {
    setRecaptchaToken(token || "");
    setIsRecaptchaValidated(!!token);
    if (token) addToast("✅ reCAPTCHA validé !", "success");
  };

  const onRecaptchaExpired = () => {
    setRecaptchaToken("");
    setIsRecaptchaValidated(false);
    addToast("⚠️ Le reCAPTCHA a expiré", "error");
  };

  const getValidToken = async () => {
    if (!isRecaptchaValidated || !recaptchaToken) {
      addToast("❌ Veuillez valider le reCAPTCHA", "error");
      return null;
    }
    return recaptchaToken;
  };

  const resetForm = () => {
    if (editorRef.current) editorRef.current.innerHTML = "";
    setImageFile(null);
    setImageUrl("");
    setScheduled(false);
    setScheduledDate("");
    setScheduledTime("");
    setTheme("");
    setTone("");
    setTimeout(() => {
      setRecaptchaToken("");
      setIsRecaptchaValidated(false);
      if (recaptchaRef.current) recaptchaRef.current.reset();
    }, 500);
  };

  const [generatePostMutation] = useMutation(GENERATE_POST, {
    onCompleted: (data) => {
      setLoading(false);
      if (data.generatePost.success && data.generatePost.post) {
        setPostsHistory((prev) => [data.generatePost.post, ...prev]);
        addToast(data.generatePost.post.scheduledAt ? "📅 Post IA programmé !" : "✨ Post IA généré !", "success");
        resetForm();
      } else {
        addToast(data.generatePost.message || "❌ Erreur", "error");
      }
    },
    onError: (error) => {
      setLoading(false);
      addToast(`❌ ${error.graphQLErrors?.[0]?.message || error.message}`, "error");
    },
  });

  const [createPostMutation] = useMutation(CREATE_POST, {
    onCompleted: (data) => {
      setLoading(false);
      if (data.createPost.success && data.createPost.post) {
        setPostsHistory((prev) => [data.createPost.post, ...prev]);
        addToast(data.createPost.post.scheduledAt ? "📅 Post programmé !" : "✅ Post créé !", "success");
        resetForm();
      } else {
        addToast(data.createPost.message || "❌ Erreur", "error");
      }
    },
    onError: (error) => {
      setLoading(false);
      const msg = error.graphQLErrors?.[0]?.message || error.message;
      if (msg?.includes("token") || msg?.includes("reCAPTCHA")) {
        setRecaptchaToken("");
        setIsRecaptchaValidated(false);
        if (recaptchaRef.current) recaptchaRef.current.reset();
      }
      addToast(`❌ ${msg}`, "error");
    },
  });

  const [publishPostMutation] = useMutation(PUBLISH_POST, {
    onCompleted: (data) => {
      setPostsHistory((prev) => prev.map((p) => (p.id === data.publishPost.post.id ? data.publishPost.post : p)));
      addToast("✅ Post publié !", "success");
    },
    onError: (error) => addToast(`❌ ${error.message}`, "error"),
  });

  const handleGenerate = async () => {
    if (loading) return;
    
    if (useAIContent && useAI && !theme?.trim()) {
      addToast("⚠️ Le thème est obligatoire !", "error");
      return;
    }
    if (useAIContent && !useAI && !editorRef.current?.innerHTML.trim() && !imageUrl && !imageFile) {
      addToast("⚠️ Le texte ou une image est obligatoire !", "error");
      return;
    }
    if (!useAIContent && !imageUrl && !imageFile) {
      addToast("⚠️ Vous devez générer ou uploader une image !", "error");
      return;
    }
    if (!isRecaptchaValidated) {
      addToast("❌ Veuillez valider le reCAPTCHA", "error");
      return;
    }
    
    setLoading(true);
    
    const token = await getValidToken();
    if (!token) {
      setLoading(false);
      return;
    }

    let scheduledAt = null;
    if (scheduled && scheduledDate && scheduledTime) {
      const dateTime = new Date(`${scheduledDate}T${scheduledTime}:00`);
      if (isNaN(dateTime.getTime())) {
        addToast("❌ Date invalide", "error");
        setLoading(false);
        return;
      }
      scheduledAt = dateTime.toISOString();
    }

    let finalImageUrl = imageUrl || null;
    if (imageFile) {
      const formData = new FormData();
      formData.append("file", imageFile);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"}/api/upload-image`, {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!data.url) {
          addToast("❌ Erreur upload image", "error");
          setLoading(false);
          return;
        }
        finalImageUrl = data.url;
      } catch (error) {
        addToast("❌ Erreur lors de l'upload de l'image", "error");
        setLoading(false);
        return;
      }
    }

    try {
      if (useAIContent && useAI) {
        await generatePostMutation({ variables: { theme, tone: tone || null, length, imageUrl: finalImageUrl, scheduledAt, recaptchaToken: token } });
      } else {
        const content = useAIContent ? (editorRef.current?.innerHTML || "") : "";
        await createPostMutation({ variables: { content, imageUrl: finalImageUrl, scheduledAt, recaptchaToken: token } });
      }
    } catch (err) {
      setLoading(false);
      addToast(`❌ ${err.message}`, "error");
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        addToast("❌ L'image ne doit pas dépasser 5 MB", "error");
        return;
      }
      setImageFile(file);
      addToast("✅ Image ajoutée !", "success");
    }
  };

  const handlePublish = async (id, content, postImageUrl) => {
    // Créer l'URL LinkedIn
    const textOnly = content ? content.replace(/<[^>]*>?/gm, "").trim() : "";
    let linkedInUrl = "https://www.linkedin.com/feed/";
    
    if (textOnly) {
      linkedInUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(textOnly)}`;
    }
    
    // Ouvrir la fenêtre LinkedIn
    const linkedInWindow = window.open(linkedInUrl, "_blank", "width=800,height=600");
    
    // Marquer le post comme publié
    await publishPostMutation({ variables: { id: parseInt(id) } });
    
    // Attendre un peu avant de vérifier
    setTimeout(() => {
      if (linkedInWindow && !linkedInWindow.closed) {
        // Si l'utilisateur a partagé manuellement, on peut fermer la fenêtre après un délai
        setTimeout(() => {
          if (linkedInWindow && !linkedInWindow.closed) {
            linkedInWindow.close();
          }
        }, 5000); // Fermer après 5 secondes
      }
    }, 1000);
  };

  return (
    <div className="space-y-6 p-6 text-lg font-semibold">
      <div className="fixed top-5 right-5 left-5 md:left-auto md:w-96 flex flex-col items-stretch z-50">
        {toasts.map((t) => (
          <Toast
            key={t.id}
            message={t.message}
            type={t.type}
            onClose={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
          />
        ))}
      </div>

      <div>
        <h2 className="text-5xl font-black tracking-tight text-blue-900">Générateur de post</h2>
        <p className="text-xl text-gray-700 mt-2">
          Générez vos contenus textuels et visuels à l'aide de l'IA ou sans IA.
        </p>
      </div>

      <div className="flex gap-4 justify-center">
        <button 
          className={`px-6 py-3 rounded-xl font-bold shadow-sm transition-all ${useAIContent ? "bg-blue-900 text-white" : "bg-blue-50 text-blue-900"}`} 
          onClick={() => setUseAIContent(true)}
        >
          📝 Contenu Textuel
        </button>
        <button 
          className={`px-6 py-3 rounded-xl font-bold shadow-sm transition-all ${!useAIContent ? "bg-blue-900 text-white" : "bg-blue-50 text-blue-900"}`} 
          onClick={() => setUseAIContent(false)}
        >
          🖼️ Contenu Visuel
        </button>
      </div>

      {useAIContent && (
        <div className="mt-6">
          <div className="flex gap-6 mt-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={useAI}
                onChange={() => setUseAI(true)}
                className="w-5 h-5"
              />
              <span className="font-medium">Avec IA</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={!useAI}
                onChange={() => setUseAI(false)}
                className="w-5 h-5"
              />
              <span className="font-medium">Texte manuel</span>
            </label>
          </div>

          {useAI ? (
            <div className="flex flex-col md:flex-row gap-4 mt-4">
              <input 
                type="text" 
                placeholder="Thème (ex: IA dans l'éducation)" 
                value={theme} 
                onChange={(e) => setTheme(e.target.value)} 
                className="border p-3 rounded-xl flex-1 shadow-sm focus:ring-2 focus:ring-blue-900" 
              />
              <select 
                value={tone} 
                onChange={(e) => setTone(e.target.value)} 
                className="border p-3 rounded-xl flex-1 shadow-sm"
              >
                <option value="">-- Ton --</option>
                <option value="professionnel">Professionnel</option>
                <option value="amical">Amical</option>
                <option value="humoristique">Humoristique</option>
                <option value="motivant">Motivant</option>
              </select>
              <select 
                value={length} 
                onChange={(e) => setLength(e.target.value)} 
                className="border p-3 rounded-xl flex-1 shadow-sm"
              >
                <option value="court">Court</option>
                <option value="moyen">Moyen</option>
                <option value="long">Long</option>
              </select>
            </div>
          ) : (
            <>
              <div className="flex gap-3 mb-4 mt-4">
                <button onClick={() => document.execCommand("bold")} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200">
                  <FiBold />
                </button>
                <button onClick={() => document.execCommand("italic")} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200">
                  <FiItalic />
                </button>
                <button onClick={() => document.execCommand("underline")} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200">
                  <FiUnderline />
                </button>
                <button onClick={() => document.execCommand("insertUnorderedList")} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200">
                  <FiList />
                </button>
              </div>
              <div 
                ref={editorRef} 
                contentEditable 
                suppressContentEditableWarning 
                className="border p-4 rounded-xl min-h-[150px] shadow-sm focus:ring-2 focus:ring-blue-900" 
              />
            </>
          )}

          <div className="flex flex-col md:flex-row gap-3 items-center mt-4">
            <label className="bg-blue-900 hover:bg-blue-950 text-white px-5 py-3 rounded-xl flex items-center gap-2 cursor-pointer shadow-sm">
              <FiUpload size={18} /> Upload une image
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageUpload(e)}
              />
            </label>
          </div>
        </div>
      )}

      {!useAIContent && (
        <div className="bg-white p-6 rounded-2xl shadow-md border mt-6">
          <h3 className="font-semibold text-lg mb-4">Générateur d'image IA</h3>
          <ImageGenerator 
            setImageUrl={setImageUrl} 
            getValidToken={getValidToken} 
            addToast={addToast} 
          />
          {(imageUrl || imageFile) && (
            <div className="mt-6 bg-gray-50 p-6 rounded-xl border">
              <p className="mb-3"><strong>👁️ Prévisualisation :</strong></p>
              <img 
                src={imageUrl || URL.createObjectURL(imageFile)} 
                alt="Preview" 
                className="w-full max-w-sm rounded-lg shadow-sm border" 
              />
            </div>
          )}
        </div>
      )}

      <div className="mt-6">
        <ReCAPTCHA
          ref={recaptchaRef}
          sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY || "6LcKJSEsAAAAAEJEapu9xwjSXocPgKYQ1RTn2zgS"}
          onChange={onRecaptchaChange}
          onExpired={onRecaptchaExpired}
        />
        <p className="text-xs text-gray-500 mt-2">
          {isRecaptchaValidated ? "✅ Validé" : "ℹ️ Veuillez cocher la case"}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input 
            type="checkbox" 
            checked={scheduled} 
            onChange={() => setScheduled(!scheduled)} 
            className="w-5 h-5" 
          />
          <span className="font-medium">📅 Programmer</span>
        </label>
      </div>

      {scheduled && (
        <div className="flex gap-4">
          <input 
            type="date" 
            value={scheduledDate} 
            onChange={(e) => setScheduledDate(e.target.value)} 
            className="border p-3 rounded-xl flex-1" 
            min={new Date().toISOString().split("T")[0]} 
          />
          <input 
            type="time" 
            value={scheduledTime} 
            onChange={(e) => setScheduledTime(e.target.value)} 
            className="border p-3 rounded-xl flex-1" 
          />
        </div>
      )}

      <button
        onClick={handleGenerate}
        disabled={loading || !isRecaptchaValidated}
        className={`w-full px-6 py-4 rounded-xl font-bold shadow-lg text-lg mt-4 ${
          !isRecaptchaValidated 
            ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
            : loading 
            ? "bg-blue-700 text-white" 
            : "bg-blue-900 text-white hover:bg-blue-950"
        }`}
      >
        {loading ? "Génération..." : !isRecaptchaValidated ? "Valider le reCAPTCHA d'abord" : "🚀 Générer / Enregistrer"}
      </button>

     {postsHistory.map((post) => {
       
          const now = new Date();
          const scheduledDate = post.scheduledAt ? new Date(post.scheduledAt) : null;
          const isPublished = post.status?.toLowerCase().includes("pub");
          const isPastDue = scheduledDate && scheduledDate <= now && !isPublished;
          const isFuture = scheduledDate && scheduledDate > now;
          
          return (
            <div key={post.id} className="p-4 border border-gray-200 rounded-xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50">
              <div className="flex-1">
                {post.content && post.content.trim() !== "" && (
                  <div dangerouslySetInnerHTML={{ __html: post.content }} />
                )}
                {post.imageUrl && (
                  <img 
                    src={post.imageUrl} 
                    alt="Post" 
                    className="w-full max-w-xs h-auto rounded-lg mt-2 border border-gray-200"
                  />
                )}
                {post.scheduledAt && (
                  <p className="text-xs text-gray-500 mt-2">
                    📅 {isPastDue ? "À publier maintenant" : isFuture ? "Programmé pour le" : "Publié le"} : {new Date(post.scheduledAt).toLocaleString('fr-FR')}
                  </p>
                )}
              
                <div className="mt-2">
                  {isPastDue ? (
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-semibold animate-pulse">
                      ⏰ À publier maintenant !
                    </span>
                  ) : isFuture ? (
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-semibold">
                       Programmé
                    </span>
                  ) : isPublished ? (
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold">
                      Publié
                    </span>
                  ) : (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold">
                       Brouillon
                    </span>
                  )}
                </div>
              </div>
            <div className="flex gap-2 mt-2 md:mt-0">
              
                {!isPublished && post.content && post.content.trim() !== "" && (
                    <button
                      onClick={() => handlePublish(post.id, post.content, post.imageUrl)}
                      className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg ${
                        isPastDue
                          ? "bg-red-600 hover:bg-red-700 animate-pulse"
                          : "bg-blue-900 hover:bg-blue-950"
                      }`}
                    >
                      <FaLinkedin size={18} />
                      Publier sur LinkedIn
                    </button>
                )}
              </div>
            </div>
          );
        })}
    </div>
  );
}