// firebase/auth.js
// Gerenciamento de Autenticação

// Variável global para saber quem está logado
let currentUser = null;

// Provedor do Google
const googleProvider = new firebase.auth.GoogleAuthProvider();

/**
 * Iniciar login com Google
 */
function loginWithGoogle() {
  firebase.auth().signInWithPopup(googleProvider)
    .then((result) => {
      console.log("Login com Google efetuado:", result.user);
    })
    .catch((error) => {
      console.error("Erro no login com Google:", error);
      alert("Erro ao fazer login com Google: " + error.message);
    });
}

/**
 * Iniciar login com E-mail e Senha
 */
function loginWithEmail(email, password) {
  firebase.auth().signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      console.log("Login com Email efetuado:", userCredential.user);
    })
    .catch((error) => {
      console.error("Erro no login com Email:", error);
      alert("Erro no login: " + error.message);
    });
}

/**
 * Deslogar
 */
function logout() {
  firebase.auth().signOut().then(() => {
    console.log("Usuário deslogado.");
  }).catch((error) => {
    console.error("Erro ao deslogar:", error);
  });
}

// Lista de e-mails autorizados para acessar o CRM
const ALLOWED_EMAILS = [
  'rafaelbernardik15@gmail.com',
  'paimfabricio77@gmail.com'
];

/**
 * Listener de mudança de estado de autenticação
 * Disparado sempre que o usuário loga ou desloga, ou quando a página carrega
 */
firebase.auth().onAuthStateChanged((user) => {
  const loginOverlay = document.getElementById('login-overlay');
  
  if (user) {
    // Verificar Whitelist
    if (!ALLOWED_EMAILS.includes(user.email)) {
      alert("Acesso Negado: O e-mail " + user.email + " não está autorizado a acessar este CRM.");
      logout();
      return;
    }

    // Usuário está logado e autorizado
    currentUser = user;
    if(loginOverlay) loginOverlay.style.display = 'none';
    
    // Opcional: Atualizar a interface com o nome/avatar do usuário
    updateUserProfile(user);
    
    // Iniciar carregamento dos dados do Firestore
    if (typeof CRM !== 'undefined') {
      // TEMP CLEANUP: Apagar todos os leads existentes antes de iniciar
      if (!window._leadCleanupDone) {
        window._leadCleanupDone = true;
        db.collection('leads').get().then((snapshot) => {
          const batch = db.batch();
          snapshot.forEach((doc) => batch.delete(doc.ref));
          return batch.commit();
        }).then(() => {
          console.log('[CRM] Todos os leads foram removidos.');
          CRM.loadDataFromFirestore();
        }).catch((err) => {
          console.error('[CRM] Erro ao limpar leads:', err);
          CRM.loadDataFromFirestore();
        });
      } else {
        CRM.loadDataFromFirestore();
      }
    }
  } else {
    // Usuário NÃO está logado
    currentUser = null;
    if(loginOverlay) loginOverlay.style.display = 'flex';
  }
});

function updateUserProfile(user) {
  const userNameEl = document.getElementById('sidebar-user-name');
  const userAvatarEl = document.getElementById('sidebar-user-avatar');
  
  if (userNameEl) userNameEl.textContent = user.displayName || user.email;
  if (userAvatarEl) {
    if (user.photoURL) {
      userAvatarEl.style.backgroundImage = `url(${user.photoURL})`;
      userAvatarEl.style.backgroundSize = 'cover';
      userAvatarEl.textContent = '';
    } else {
      userAvatarEl.textContent = (user.displayName || user.email).charAt(0).toUpperCase();
      userAvatarEl.style.backgroundImage = 'none';
    }
  }
}
