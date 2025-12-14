import { useState } from "react";
import { useUser, useClerk, UserButton } from "@clerk/clerk-react";
import {
  FiSun,
  FiMoon,
  FiLogOut,
  FiLinkedin,
  FiSettings,
} from "react-icons/fi";

export default function Parametres({ theme, toggleTheme }) {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [toast, setToast] = useState(null);

  if (!isLoaded) return <p className="p-6">Chargement du profil…</p>;

  const linkedInAccount = user.externalAccounts?.find(
    (acc) => acc.provider === "oauth_linkedin"
  );

  const profile = {
    firstName: linkedInAccount?.firstName || user.firstName,
    lastName: linkedInAccount?.lastName || user.lastName,
    email:
      linkedInAccount?.emailAddress ||
      user.primaryEmailAddress?.emailAddress,
    headline: linkedInAccount?.username || "Profil LinkedIn",
    avatar: linkedInAccount?.imageUrl || user.imageUrl,
    profileUrl: linkedInAccount
      ? `https://www.linkedin.com/in/${linkedInAccount.username}`
      : "",
  };

  const handleConfirmLogout = async () => {
    setShowLogoutModal(false);
    await signOut();

    if (window.grecaptcha) {
      window.grecaptcha.reset();
    }

    setToast("Déconnecté avec succès !");
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="space-y-8 p-6">
      <h2 className="text-5xl font-black tracking-tight text-blue-900 dark:text-blue-300">
        Paramètres
      </h2>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Gestion du compte */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border p-6">
            <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FiSettings className="text-blue-600" />
              Gestion du compte
            </h4>

            <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
              <div>
                <p className="font-medium">Paramètres Clerk</p>
                <p className="text-sm text-gray-500">Sécurité & session</p>
              </div>

              <UserButton
                appearance={{
                  elements: {
                    avatarBox:
                      "w-10 h-10 border-2 border-blue-600 dark:border-blue-400",
                  },
                }}
              />
            </div>
          </div>
        </div>

        {/* Profil */}
        <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <img
              src={profile.avatar}
              alt="Avatar"
              className="w-28 h-28 rounded-2xl object-cover ring-2 ring-gray-300"
            />

            <div className="flex-1">
              <h3 className="text-2xl font-bold">
                {profile.firstName} {profile.lastName}
              </h3>

              <p className="text-sm text-gray-500">{profile.headline}</p>
              <p className="mt-2 text-sm">{profile.email}</p>

              {linkedInAccount && (
                <a
                  href={profile.profileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 font-medium hover:scale-105 transition"
                >
                  <FiLinkedin /> Voir LinkedIn
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Déconnexion */}
      <div className="bg-white dark:bg-gray-800 border rounded-2xl p-6 shadow-lg flex justify-between items-center">
        <div>
          <h4 className="text-lg font-semibold">Session</h4>
          <p className="text-sm text-gray-500">
            Déconnexion sécurisée
          </p>
        </div>

        <button
          onClick={() => setShowLogoutModal(true)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-red-600 text-white font-semibold hover:scale-105 transition"
        >
          <FiLogOut /> Déconnexion
        </button>
      </div>

      {/* Modal logout */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowLogoutModal(false)}
          />

          <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl max-w-md w-full">
            <h3 className="text-xl font-bold mb-6">
              Voulez-vous vous déconnecter ?
            </h3>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 rounded-lg border"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmLogout}
                className="px-4 py-2 rounded-lg bg-red-600 text-white"
              >
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-white dark:bg-gray-800 border rounded-lg p-4 shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
