// Dashboard.jsx - Section "Mon Profil" sans statistiques
import { useState, useEffect } from "react";
import {
  FiMenu,
  FiHome,
  FiPlusCircle,
  FiClock,
  FiSettings,
  FiUser,
  FiLinkedin,
  FiMail,
  FiExternalLink,
} from "react-icons/fi";
import { useUser, RedirectToSignIn } from "@clerk/clerk-react";
import { useQuery, gql } from "@apollo/client";

import GenererPost from "./GenererPost";
import Historique from "./Historique";
import Parametres from "./Parametres";
import TableauDeBord from "./TableauDeBord";

const ALL_POSTS = gql`
  query {
    allPosts {
      id
      content
      status
      imageUrl
      createdAt
      scheduledAt
    }
  }
`;

export default function Dashboard() {
  const { user, isLoaded, isSignedIn, signOut } = useUser();
  const [activeMenu, setActiveMenu] = useState("Tableau de Bord");
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [showMessage, setShowMessage] = useState(false);
  const [toast, setToast] = useState(null);

  useQuery(ALL_POSTS, { pollInterval: 30000 });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    if (isSignedIn) {
      setShowMessage(true);
      const t = setTimeout(() => setShowMessage(false), 3000);
      return () => clearTimeout(t);
    }
  }, [isSignedIn]);

  if (!isLoaded) return <p className="p-6">Chargement…</p>;
  if (!isSignedIn) return <RedirectToSignIn />;

  const linkedInAccount = user.externalAccounts?.find(
    (acc) => acc.provider === "oauth_linkedin"
  );

  const profile = {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.primaryEmailAddress?.emailAddress,
    avatar: user.imageUrl,
    profileUrl: linkedInAccount
      ? `https://www.linkedin.com/in/${linkedInAccount.username}`
      : "",
  };

  const menuItems = [
    { name: "Tableau de Bord", icon: <FiHome /> },
    { name: "Générer post", icon: <FiPlusCircle /> },
    { name: "Historique", icon: <FiClock /> },
    { name: "Paramètres", icon: <FiSettings /> },
    { name: "Mon Profil", icon: <FiUser /> },
  ];

  const renderContent = () => {
    switch (activeMenu) {
      case "Tableau de Bord":
        return <TableauDeBord />;
      case "Générer post":
        return <GenererPost />;
      case "Historique":
        return <Historique />;
      case "Paramètres":
        return (
          <Parametres
            profile={profile}
            theme={theme}
            toggleTheme={() =>
              setTheme((t) => (t === "dark" ? "light" : "dark"))
            }
          />
        );

      case "Mon Profil":
        return (
          <div className="max-w-5xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-10">Mon Profil</h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Carte Profil */}
              <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-3xl shadow-lg overflow-hidden">
                <div className="bg-blue-800 h-32 relative">
                  <img
                    src={profile.avatar}
                    alt="Profil"
                    className="absolute -bottom-16 left-8 w-32 h-32 rounded-full border-4 border-white"
                  />
                </div>

                <div className="pt-20 px-8 pb-8">
                  <h3 className="text-2xl font-bold">
                    {profile.firstName} {profile.lastName}
                  </h3>
                  <p className="flex items-center gap-2 text-gray-500">
                    <FiMail /> {profile.email}
                  </p>
                </div>
              </div>

              {/* LinkedIn */}
              {linkedInAccount && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow">
                  <h4 className="font-semibold flex items-center gap-2 mb-4">
                    <FiLinkedin /> LinkedIn
                  </h4>
                  <a
                    href={profile.profileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-2"
                  >
                    Voir le profil <FiExternalLink />
                  </a>
                </div>
              )}

              {/* Actions */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow">
                <h4 className="font-semibold mb-4">Actions rapides</h4>
                <button
                  onClick={() => setActiveMenu("Générer post")}
                  className="w-full p-3 bg-blue-600 text-white rounded-xl"
                >
                  Créer un post
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 p-6">
        <h1 className="text-2xl font-bold mb-8">Linkpostify</h1>
        {menuItems.map((item) => (
          <div
            key={item.name}
            onClick={() => setActiveMenu(item.name)}
            className={`p-3 rounded-lg cursor-pointer flex items-center gap-3 mb-2 ${
              activeMenu === item.name
                ? "bg-blue-600 text-white"
                : "hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {item.icon}
            {item.name}
          </div>
        ))}
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 overflow-y-auto">{renderContent()}</main>

      {showMessage && (
        <div className="fixed top-6 right-6 bg-blue-600 text-white p-4 rounded-xl">
          Bienvenue {profile.firstName} 👋
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-white p-4 shadow rounded">
          {toast}
        </div>
      )}
    </div>
  );
}
