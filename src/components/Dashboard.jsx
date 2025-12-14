// Dashboard.jsx - Section "Mon Profil" sans les statistiques
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

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState("Tableau de Bord");
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [showMessage, setShowMessage] = useState(false);
  const [toast, setToast] = useState(null);

  useQuery(ALL_POSTS, { pollInterval: 30000 });

  useEffect(() => {
    const root = document.documentElement;
    theme === "dark"
      ? root.classList.add("dark")
      : root.classList.remove("dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((t) => (t === "dark" ? "light" : "dark"));

  useEffect(() => {
    if (isSignedIn) {
      setShowMessage(true);
      const t = setTimeout(() => setShowMessage(false), 3000);
      return () => clearTimeout(t);
    }
  }, [isSignedIn]);

  if (!isLoaded) return <p className="p-6">Chargement du profil…</p>;
  if (!isSignedIn) return <RedirectToSignIn />;

  const linkedInAccount = user.externalAccounts?.find(
    (acc) => acc.provider === "oauth_linkedin"
  );

  const profile = {
    firstName: user.firstName || linkedInAccount?.firstName,
    lastName: user.lastName || linkedInAccount?.lastName,
    email:
      user.primaryEmailAddress?.emailAddress ||
      linkedInAccount?.emailAddress,
    avatar: user.imageUrl || linkedInAccount?.imageUrl,
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
            toggleTheme={toggleTheme}
          />
        );

      case "Mon Profil":
        return (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-900 to-blue-600 bg-clip-text text-transparent">
                Mon Profil
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Gérez vos informations personnelles
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Profil principal */}
              <div className="lg:col-span-2">
                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-900 to-blue-700 h-32 relative">
                    <img
                      src={profile.avatar}
                      alt="Profil"
                      className="absolute -bottom-16 left-8 w-32 h-32 rounded-full border-4 border-white shadow-xl"
                    />
                  </div>

                  <div className="pt-20 px-8 pb-8">
                    <h3 className="text-2xl font-bold mb-2">
                      {profile.firstName} {profile.lastName}
                    </h3>
                    <p className="flex items-center gap-2 text-gray-600">
                      <FiMail /> {profile.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* LinkedIn */}
              {linkedInAccount && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border p-6">
                  <h4 className="font-semibold flex items-center gap-2 mb-4">
                    <FiLinkedin /> Profil LinkedIn
                  </h4>
                  <a
                    href={profile.profileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg"
                  >
                    Voir mon profil <FiExternalLink size={14} />
                  </a>
                </div>
              )}

              {/* Actions */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border p-6">
                <h4 className="font-semibold mb-4">Actions rapides</h4>
                <button
                  onClick={() => setActiveMenu("Générer post")}
                  className="w-full p-3 rounded-xl bg-blue-50 text-blue-700"
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
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 shadow-md flex flex-col">
        <div className="p-6 text-2xl font-bold border-b">
          Linkpostify
        </div>

        <ul className="mt-6 space-y-3 flex-1 px-3">
          {menuItems.map((item) => (
            <li
              key={item.name}
              onClick={() => setActiveMenu(item.name)}
              className={`flex items-center p-4 rounded-md cursor-pointer ${
                activeMenu === item.name
                  ? "bg-blue-900 text-white"
                  : "hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.name}
            </li>
          ))}
        </ul>
      </div>

      <main className="flex-1 ml-64 p-6">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-md min-h-full">
          {renderContent()}
        </div>

        {showMessage && (
          <div className="fixed top-20 right-5 bg-blue-600 text-white px-6 py-4 rounded-2xl shadow-xl">
            Bienvenue {profile.firstName} 👋
          </div>
        )}

        {toast && (
          <div className="fixed bottom-6 right-6 bg-white p-4 shadow rounded">
            {toast}
          </div>
        )}
      </main>
    </div>
  );
}
