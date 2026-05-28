// services/firestore.js
// Métodos auxiliares para interagir com o Firestore Database

/**
 * Inscreve-se em tempo real em uma coleção inteira do Firestore.
 * @param {string} collectionName Nome da coleção
 * @param {function} callback Função a ser chamada quando os dados mudarem
 */
function listenCollection(collectionName, callback) {
  return db.collection(collectionName).onSnapshot((snapshot) => {
    const data = [];
    snapshot.forEach((doc) => {
      data.push({ id: doc.id, ...doc.data() });
    });
    callback(data);
  }, (error) => {
    console.error(`Erro ao escutar a coleção ${collectionName}:`, error);
  });
}

/**
 * Adiciona um novo documento a uma coleção.
 */
async function addDocument(collectionName, data) {
  try {
    const docRef = await db.collection(collectionName).add({
      ...data,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error(`Erro ao adicionar em ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Atualiza um documento existente.
 */
async function updateDocument(collectionName, docId, data) {
  try {
    await db.collection(collectionName).doc(docId).update({
      ...data,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error(`Erro ao atualizar em ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Atualiza especificamente o estágio de um lead (Kanban)
 */
async function updateLeadStageInDB(leadId, newStage) {
  return updateDocument('leads', leadId, { stage: newStage });
}

/**
 * Deleta um documento.
 */
async function deleteDocument(collectionName, docId) {
  try {
    await db.collection(collectionName).doc(docId).delete();
  } catch (error) {
    console.error(`Erro ao deletar em ${collectionName}:`, error);
    throw error;
  }
}
