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
  FiCalendar,
  FiClock,
} from "react-icons/fi";
import ReCAPTCHA from "react-google-recaptcha";

// GraphQL Mutations
const CREATE_POST = gql`
  mutation CreatePost($content: String!, $imageUrl: String, $scheduledAt: String, $recaptchaToken: String!) {
    createPost(content: $content, imageUrl: $imageUrl, scheduledAt: $scheduledAt, recaptchaToken: $recaptchaToken) {
      success
      message
      post {
        id
        content
        status
        imageUrl
        createdAt
        scheduledAt
      }
    }
  }
`;

const GENERATE_POST = gql`
  mutation GeneratePost(
    $theme: String!
    $tone: String
    $length: String
    $imageUrl: String
    $scheduledAt: String
    $recaptchaToken: String!
  ) {
    generatePost(
      theme: $theme
      tone: $tone
      length: $length
      imageUrl: $imageUrl
      scheduledAt: $scheduledAt
      recaptchaToken: $recaptchaToken
    ) {
      success
      message
      post {
        id
        content
        status
        imageUrl
        createdAt
        scheduledAt
      }
    }
  }
`;

const PUBLISH_POST = gql`
  mutation PublishPost($id: Int!) {
    publishPost(id: $id) {
      post {
        id
        content
        status
        imageUrl
        scheduledAt
      }
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

// Toast Component
function Toast({ message, type, onClose }) {
  const styles =
    type === "success"
      ? "bg-white border-l-4 border-emerald-500 text-gray-800"
      : type === "error"
      ? "bg-white border-l-4 border-rose-500 text-gray-800"
      : "bg-white border-l-4 border-blue-500 text-gray-800";

  return (
    <div className={`flex items-center gap-3 px-6 py-4 rounded-lg shadow-2xl ${styles} mb-3 backdrop-blur-sm animate-slideDown`}>
      {type === "success" && <FiCheckCircle size={22} className="text-emerald-500" />}
      {type === "error" && <FiXCircle size={22} className="text-rose-500" />}
      <span className="flex-1 font-medium">{message}</span>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold text-lg">✕</button>
    </div>
  );
}

// Image Generator Component
function ImageGenerator({ setImageUrl, recaptchaRef, getValidToken, addToast }) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const [generateImageMutation] = useMutation(GENERATE_IMAGE, {
    onCompleted: (data) => {
      if (data.generateImage.success) {
        setImageUrl(data.generateImage.imageUrl);
        addToast("✨ Image générée avec succès !", "success");
      } else {
        addToast(`❌ ${data.generateImage.message}`, "error");
      }
      setLoading(false);
    },
    onError: (err) => {
      console.error(err);
      addToast("❌ Erreur lors de la génération de l'image.", "error");
      setLoading(false);
    },
  });

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      addToast("⚠️ Entre un prompt pour générer l'image !", "error");
      return;
    }
    if (loading) return;
    
    setLoading(true);
    
    try {
      // ✅ Obtenir le token reCAPTCHA
      const token = await getValidToken();
      
      if (!token) {
        setLoading(false);
        return;
      }

      await generateImageMutation({
        variables: {
          prompt,
          recaptchaToken: token
        }
      });
    } catch (err) {
      console.error("❌ Erreur generateImage:", err);
      const errorMsg = err.graphQLErrors?.[0]?.message || err.message || "Erreur inconnue";
      addToast(`❌ ${errorMsg}`, "error");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <input
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Tape ton prompt ici (ex: une plage au coucher du soleil)"
        className="border border-gray-300 p-3 rounded-2xl shadow-sm w-full focus:ring-2 focus:ring-blue-900 focus:border-transparent"
      />

      <button
        onClick={handleGenerate}
        disabled={loading}
        className="bg-blue-900 text-white px-5 py-3 rounded-xl hover:bg-blue-950 shadow-md font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Génération en cours...
          </span>
        ) : "✨ Générer l'image"}
      </button>
    </div>
  );
}

// Main Component
export default function GenererPost() {
  const recaptchaRef = useRef(null);
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
  const [previewContent, setPreviewContent] = useState("");
  const editorRef = useRef();

  const addToast = (message, type) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  // ✅ GESTION reCAPTCHA VISIBLE
  const onRecaptchaChange = (token) => {
    console.log("✅ reCAPTCHA validé, token reçu:", token ? token.substring(0, 20) + "..." : "null");
    setRecaptchaToken(token || "");
    setIsRecaptchaValidated(!!token);
    
    if (token) {
      addToast("✅ reCAPTCHA validé !", "success");
    } else {
      setIsRecaptchaValidated(false);
    }
  };

  const onRecaptchaExpired = () => {
    console.log("⚠️ reCAPTCHA expiré");
    setRecaptchaToken("");
    setIsRecaptchaValidated(false);
    addToast("⚠️ Le reCAPTCHA a expiré, veuillez le valider à nouveau", "error");
  };

  const onRecaptchaError = (error) => {
    console.error("❌ Erreur reCAPTCHA:", error);
    setRecaptchaToken("");
    setIsRecaptchaValidated(false);
    addToast("❌ Erreur reCAPTCHA, veuillez réessayer", "error");
  };

  // ✅ FONCTION POUR reCAPTCHA VISIBLE
  const getValidToken = async () => {
    console.log("🔐 Vérification reCAPTCHA...");
    
    // Vérifier si l'utilisateur a coché la case
    if (!isRecaptchaValidated) {
      addToast("❌ Veuillez cocher la case reCAPTCHA avant d'envoyer", "error");
      return null;
    }

    // Vérifier si le token existe
    if (!recaptchaToken || recaptchaToken.trim() === "") {
      console.log("❌ Aucun token reCAPTCHA disponible");
      addToast("❌ Token reCAPTCHA manquant, veuillez revalider", "error");
      return null;
    }

    console.log("✅ Token reCAPTCHA disponible:", recaptchaToken.substring(0, 20) + "...");
    
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
    
    // Reset reCAPTCHA après succès
    setTimeout(() => {
      setRecaptchaToken("");
      setIsRecaptchaValidated(false);
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
    }, 500);
  };

  const [generatePostMutation] = useMutation(GENERATE_POST, {
    onCompleted: (data) => {
      setLoading(false);
      if (data.generatePost.success && data.generatePost.post) {
        const post = data.generatePost.post;
        setPostsHistory((prev) => [post, ...prev]);
        
        // ✅ MESSAGE DE SUCCÈS POUR POST IA
        let successMessage = "✨ Post IA généré avec succès !";
        if (post.scheduledAt) {
          const date = new Date(post.scheduledAt);
          successMessage = `📅 Post IA programmé pour le ${date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit'
          })} !`;
        }
        
        addToast(successMessage, "success");
        resetForm();
      } else {
        addToast(data.generatePost.message || "❌ Erreur de génération", "error");
      }
    },
    onError: (error) => {
      console.error("❌ Erreur generatePost:", error);
      const errorMessage = error.graphQLErrors?.[0]?.message || error.message;
      addToast(`❌ ${errorMessage}`, "error");
      setLoading(false);
    },
  });

  const [createPostMutation] = useMutation(CREATE_POST, {
    onCompleted: (data) => {
      setLoading(false);
      if (data.createPost.success && data.createPost.post) {
        const post = data.createPost.post;
        setPostsHistory((prev) => [post, ...prev]);
        
        // ✅ MESSAGE DE SUCCÈS AMÉLIORÉ
        let successMessage = "✅ Post créé avec succès !";
        if (post.scheduledAt) {
          const date = new Date(post.scheduledAt);
          successMessage = `📅 Post programmé pour le ${date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit'
          })} !`;
        }
        
        addToast(successMessage, "success");
        resetForm();
      } else {
        addToast(data.createPost.message || "❌ Erreur lors de la création", "error");
      }
    },
    onError: (error) => {
      console.error("❌ Erreur createPost:", error);
      const errorMessage = error.graphQLErrors?.[0]?.message || error.message;
      
      // Vérifier si c'est une erreur de token expiré
      if (errorMessage && (
        errorMessage.includes("expiré") || 
        errorMessage.includes("expired") || 
        errorMessage.includes("token") ||
        errorMessage.includes("reCAPTCHA") ||
        errorMessage.includes("captcha")
      )) {
        // Reset reCAPTCHA en cas d'expiration
        setRecaptchaToken("");
        setIsRecaptchaValidated(false);
        if (recaptchaRef.current) {
          recaptchaRef.current.reset();
        }
        addToast("❌ Le token reCAPTCHA a expiré. Veuillez le valider à nouveau.", "error");
      } else {
        addToast(`❌ ${errorMessage}`, "error");
      }
      setLoading(false);
    },
  });

  const [publishPostMutation] = useMutation(PUBLISH_POST, {
    onCompleted: (data) => {
      const updatedPost = data.publishPost.post;
      setPostsHistory((prev) =>
        prev.map((p) => (p.id === updatedPost.id ? updatedPost : p))
      );
      addToast("✅ Post publié avec succès !", "success");
    },
    onError: (error) => {
      console.error("Erreur publication:", error);
      addToast(`❌ Erreur: ${error.message}`, "error");
    },
  });

  const handleGenerate = async () => {
    if (loading) return;
    
    // Vérifications de base
    if (useAIContent) {
      if (useAI) {
        if (!theme?.trim()) {
          addToast("Le thème est obligatoire pour l'IA !", "error");
          return;
        }
      } else {
        const rawContent = editorRef.current?.innerHTML || "";
        if (!rawContent.trim() && !imageUrl && !imageFile) {
          addToast("Le texte ou une image est obligatoire !", "error");
          return;
        }
      }
    } else {
      if (!imageUrl && !imageFile) {
        addToast("⚠️ Vous devez générer ou uploader une image !", "error");
        return;
      }
    }
    
    // ✅ Vérification IMPORTANTE : reCAPTCHA doit être validé
    if (!isRecaptchaValidated) {
      addToast("❌ Veuillez cocher la case reCAPTCHA avant d'envoyer", "error");
      return;
    }
    
    setLoading(true);

    try {
      // ✅ ÉTAPE 1 : Obtenir le token reCAPTCHA
      console.log("🔐 Obtention du token reCAPTCHA...");
      const token = await getValidToken();
      
      if (!token) {
        setLoading(false);
        return;
      }

      console.log("🔐 Token obtenu:", token.substring(0, 20) + "...");

      // ✅ ÉTAPE 2 : Validation de la date programmée
      let scheduledAt = null;
      if (scheduled && scheduledDate && scheduledTime) {
        const dateTime = new Date(`${scheduledDate}T${scheduledTime}:00`);
        if (isNaN(dateTime.getTime())) {
          addToast("❌ Date ou heure invalide", "error");
          setLoading(false);
          return;
        }
        scheduledAt = dateTime.toISOString();
      }

      // ✅ ÉTAPE 3 : Upload de l'image si nécessaire
      let finalImageUrl = imageUrl || null;
      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"}/api/upload-image`, {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!data.url) throw new Error("Erreur upload image");
        finalImageUrl = data.url;
      }

      // ✅ ÉTAPE 4 : Envoi de la mutation
      if (useAIContent) {
        if (useAI) {
          console.log("📤 Envoi generatePost");
          
          await generatePostMutation({
            variables: {
              theme,
              tone: tone || null,
              length,
              imageUrl: finalImageUrl,
              scheduledAt,
              recaptchaToken: token
            }
          });
        } else {
          const rawContent = editorRef.current?.innerHTML || "";
          console.log("📤 Envoi createPost");
          
          await createPostMutation({
            variables: {
              content: rawContent,
              imageUrl: finalImageUrl,
              scheduledAt,
              recaptchaToken: token
            }
          });
        }
      } else {
        console.log("📤 Envoi createPost (visuel)");
        
        await createPostMutation({
          variables: {
            content: "",
            imageUrl: finalImageUrl,
            scheduledAt,
            recaptchaToken: token
          }
        });
      }

    } catch (err) {
      console.error("❌ Erreur handleGenerate:", err);
      const errorMsg = err.graphQLErrors?.[0]?.message || err.message || "Erreur inconnue";
      
      // Message spécifique pour les erreurs reCAPTCHA
      if (errorMsg && (
        errorMsg.includes("reCAPTCHA") || 
        errorMsg.includes("captcha") || 
        errorMsg.includes("token") ||
        errorMsg.includes("expiré") ||
        errorMsg.includes("expired")
      )) {
        addToast("❌ Erreur de vérification reCAPTCHA. Le token est peut-être expiré (2min max). Veuillez revalider.", "error");
        // Reset reCAPTCHA en cas d'erreur
        setIsRecaptchaValidated(false);
        setRecaptchaToken("");
        if (recaptchaRef.current) {
          recaptchaRef.current.reset();
        }
      } else {
        addToast(`❌ ${errorMsg}`, "error");
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    let content = "";
    const finalImageUrl = imageFile ? URL.createObjectURL(imageFile) : imageUrl;

    if (useAIContent) {
      if (useAI) {
        content = `<p><strong>Thème :</strong> ${theme || "—"}</p>
                   <p><strong>Ton :</strong> ${tone || "—"}</p>
                   <p><strong>Longueur :</strong> ${length}</p>`;
      } else if (editorRef.current) {
        content = editorRef.current.innerHTML || "";
      }
    } else {
      content = finalImageUrl ? `<p>Image :</p><img src="${finalImageUrl}" style="max-width:100%; border-radius:8px;" />` : "";
    }

    setPreviewContent(content);

    return () => {
      if (imageFile && finalImageUrl) URL.revokeObjectURL(finalImageUrl);
    };
  }, [theme, tone, length, imageFile, imageUrl, useAIContent, useAI]);

  const copyContent = (content) => {
    const textOnly = content.replace(/<[^>]*>?/gm, "").trim();
    navigator.clipboard.writeText(textOnly);
    addToast("📋 Contenu copié !", "success");
  };

  const handlePublish = async (id, content) => {
    try {
      const textOnly = content.replace(/<[^>]*>?/gm, "").trim();
      const linkedInUrl = textOnly
        ? `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(textOnly)}`
        : "https://www.linkedin.com/feed/";
      window.open(linkedInUrl, "_blank", "width=800,height=600");
      await publishPostMutation({ variables: { id: parseInt(id) } });
    } catch (err) {
      console.error("Erreur publication:", err);
      addToast("❌ Erreur lors de la publication", "error");
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

  return (
    <div className="space-y-6 p-4 max-w-5xl mx-auto">
      <div className="fixed top-5 right-5 left-5 md:left-auto md:w-96 flex flex-col items-stretch z-50">
        {toasts.map((t) => (
          <Toast key={t.id} message={t.message} type={t.type} onClose={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))} />
        ))}
      </div>

      <div className="text-center">
        <h2 className="text-4xl font-extrabold tracking-wide text-black">Générateur de post</h2>
        <p className="text-sm text-gray-600 mt-2">Générer vos contenus textuels et visuels à l'aide de l'IA ou sans IA.</p>
      </div>

      <div className="flex gap-4 justify-center">
        <button
          className={`px-6 py-3 rounded-xl font-semibold shadow-sm transition-all ${useAIContent ? "bg-blue-900 text-white" : "bg-blue-50 text-blue-900 hover:bg-blue-100"}`}
          onClick={() => setUseAIContent(true)}
        >
          📝 Contenu Textuel
        </button>
        <button
          className={`px-6 py-3 rounded-xl font-semibold shadow-sm transition-all ${!useAIContent ? "bg-blue-900 text-white" : "bg-blue-50 text-blue-900 hover:bg-blue-100"}`}
          onClick={() => setUseAIContent(false)}
        >
          🖼️ Contenu Visuel
        </button>
      </div>

      {useAIContent && (
        <div className="mt-6 bg-white p-6 rounded-2xl shadow-md border border-gray-100">
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={useAI} onChange={() => setUseAI(true)} className="w-4 h-4 text-blue-900" />
              <span className="font-medium">🤖 Avec IA</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={!useAI} onChange={() => setUseAI(false)} className="w-4 h-4 text-blue-900" />
              <span className="font-medium">✍️ Texte manuel</span>
            </label>
          </div>

          {useAI ? (
            <div className="flex flex-col md:flex-row gap-4 mt-4">
              <input 
                type="text" 
                placeholder="Thème (ex: IA dans l'éducation)" 
                value={theme} 
                onChange={(e) => setTheme(e.target.value)} 
                className="border border-gray-300 p-3 rounded-xl flex-1 shadow-sm focus:ring-2 focus:ring-blue-900 focus:border-transparent" 
              />
              <select 
                value={tone} 
                onChange={(e) => setTone(e.target.value)} 
                className="border border-gray-300 p-3 rounded-xl flex-1 shadow-sm focus:ring-2 focus:ring-blue-900 focus:border-transparent"
              >
                <option value="">-- Choisir le ton --</option>
                <option value="professionnel">Professionnel</option>
                <option value="amical">Amical</option>
                <option value="humoristique">Humoristique</option>
                <option value="motivant">Motivant</option>
              </select>
              <select 
                value={length} 
                onChange={(e) => setLength(e.target.value)} 
                className="border border-gray-300 p-3 rounded-xl flex-1 shadow-sm focus:ring-2 focus:ring-blue-900 focus:border-transparent"
              >
                <option value="court">Court</option>
                <option value="moyen">Moyen</option>
                <option value="long">Long</option>
              </select>
            </div>
          ) : (
            <>
              <div className="flex gap-3 mt-4">
                <button onClick={() => document.execCommand("bold")} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"><FiBold /></button>
                <button onClick={() => document.execCommand("italic")} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"><FiItalic /></button>
                <button onClick={() => document.execCommand("underline")} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"><FiUnderline /></button>
                <button onClick={() => document.execCommand("insertUnorderedList")} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"><FiList /></button>
              </div>
              <div 
                ref={editorRef} 
                contentEditable 
                suppressContentEditableWarning 
                className="border border-gray-300 p-4 rounded-xl min-h-[150px] text-lg shadow-sm focus:ring-2 focus:ring-blue-900 focus:border-transparent mt-4"
                onInput={() => setPreviewContent(editorRef.current?.innerHTML)}
              />
            </>
          )}

          <div className="mt-4">
            <label className="flex items-center gap-2 cursor-pointer bg-gray-50 px-4 py-3 rounded-xl hover:bg-gray-100 transition-colors border border-gray-200">
              <FiUpload className="text-blue-900" />
              <span className="font-medium text-gray-700">📎 Ajouter une image (optionnel)</span>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
            {imageFile && (
              <div className="mt-2 text-sm text-green-600 flex items-center gap-2">
                <FiCheckCircle />
                <span>{imageFile.name}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {!useAIContent && (
        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
          <h3 className="font-semibold text-lg mb-4 text-gray-800">Générateur d'image IA</h3>
          <ImageGenerator
            setImageUrl={setImageUrl}
            recaptchaRef={recaptchaRef}
            getValidToken={getValidToken}
            addToast={addToast}
          />
        </div>
      )}

      {/* ✅ reCAPTCHA VISIBLE */}
      <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
          🔒 Vérification de sécurité {isRecaptchaValidated && <span className="text-emerald-500 text-sm">✓ Validé</span>}
        </h3>
        <ReCAPTCHA
          ref={recaptchaRef}
          sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY || "6LcKJSEsAAAAAEJEapu9xwjSXocPgKYQ1RTn2zgS"}
          onChange={onRecaptchaChange}
          onExpired={onRecaptchaExpired}
          onErrored={onRecaptchaError}
          size="normal"
          theme="light"
        />
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-500">
            {isRecaptchaValidated 
              ? "✅ reCAPTCHA validé - Envoi possible pendant 2 minutes" 
              : "ℹ️ Veuillez cocher la case \"Je ne suis pas un robot\""}
          </p>
          {isRecaptchaValidated && (
            <button 
              onClick={() => {
                if (recaptchaRef.current) {
                  recaptchaRef.current.reset();
                  setRecaptchaToken("");
                  setIsRecaptchaValidated(false);
                  addToast("reCAPTCHA réinitialisé", "success");
                }
              }}
              className="text-xs text-rose-600 hover:text-rose-800 font-medium"
            >
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl shadow-md border border-blue-100">
        <div className="flex items-center gap-3 mb-4">
          <FiCalendar className="text-blue-900 text-2xl" />
          <h3 className="font-semibold text-lg text-blue-900">Programmation de publication</h3>
        </div>
        
        <div className="flex items-start gap-3">
          <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2 rounded-xl shadow-sm hover:shadow-md transition-all">
            <input 
              type="checkbox" 
              checked={scheduled} 
              onChange={(e) => setScheduled(e.target.checked)} 
              className="w-4 h-4 text-blue-900"
            />
            <span className="font-medium text-gray-700">📅 Programmer ce post</span>
          </label>
          
          {scheduled && (
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm flex-1">
                <FiCalendar className="text-blue-900" />
                <input 
                  type="date" 
                  value={scheduledDate} 
                  onChange={(e) => setScheduledDate(e.target.value)} 
                  className="border-0 focus:ring-0 w-full text-gray-700 font-medium"
                />
              </div>
              
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm flex-1">
                <FiClock className="text-blue-900" />
                <input 
                  type="time" 
                  value={scheduledTime} 
                  onChange={(e) => setScheduledTime(e.target.value)} 
                  className="border-0 focus:ring-0 w-full text-gray-700 font-medium"
                />
              </div>
            </div>
          )}
        </div>
        
        {scheduled && scheduledDate && scheduledTime && (
          <div className="mt-3 p-3 bg-white rounded-xl text-sm text-gray-600">
            📅 Publication prévue le <strong>{new Date(`${scheduledDate}T${scheduledTime}`).toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</strong>
          </div>
        )}
      </div>

      {/* ✅ BOUTON AMÉLIORÉ AVEC ANIMATION */}
      <button
        onClick={handleGenerate}
        disabled={loading || !isRecaptchaValidated}
        className={`w-full px-6 py-4 rounded-xl font-bold shadow-lg transition-all duration-200 text-lg flex items-center justify-center gap-3 ${
          !isRecaptchaValidated 
            ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
            : loading
              ? "bg-blue-700 text-white"
              : "bg-blue-900 text-white hover:bg-blue-950"
        }`}
      >
        {loading ? (
          <>
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            ⏳ Génération en cours...
          </>
        ) : (
          !isRecaptchaValidated ? "⏳ Valider le reCAPTCHA d'abord" : "✨ Générer / Enregistrer le post"
        )}
      </button>

      {previewContent && (
        <div className="mt-6 p-6 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-2xl shadow-md">
          <h3 className="font-bold text-xl mb-3 text-gray-800">👁️ Prévisualisation</h3>
          <div dangerouslySetInnerHTML={{ __html: previewContent }} className="prose max-w-none" />
          <button 
            onClick={() => copyContent(previewContent)} 
            className="mt-4 text-sm text-blue-900 font-semibold bg-white px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors shadow-sm"
          >
            📋 Copier le contenu
          </button>
        </div>
      )}

      {/* Historique */}
      {postsHistory.length > 0 && (
        <div className="mt-8">
          <h3 className="font-bold text-2xl mb-4 text-gray-800">📚 Historique des posts</h3>
          <div className="space-y-4">
            {postsHistory.map((p) => (
              <div key={p.id} className="bg-white border border-gray-200 p-5 rounded-2xl shadow-md hover:shadow-lg transition-shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div dangerouslySetInnerHTML={{ __html: p.content }} className="flex-1 prose max-w-none" />
                {p.imageUrl && <img src={p.imageUrl} alt="" className="max-w-[150px] rounded-xl shadow-sm" />}
                <div className="flex gap-2 mt-2 md:mt-0">
                  {p.status !== "Publié" && (
                    <button
                      onClick={() => handlePublish(p.id, p.content)}
                      className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-600 transition-colors shadow-sm"
                    >
                      ✓ Publier
                    </button>
                  )}
                  <button 
                    onClick={() => copyContent(p.content)} 
                    className="bg-blue-50 text-blue-900 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-100 transition-colors shadow-sm"
                  >
                    📋 Copier
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}