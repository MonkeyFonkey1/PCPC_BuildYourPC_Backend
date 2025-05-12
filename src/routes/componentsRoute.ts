import express from 'express';
import {
    getAllComponents,
    searchComponents,
    addComponent,
    updateComponent,
    deleteComponent,
    getCompatibleMotherboards,
    searchComponentsWithoutCompatibilty,
} from '../controllers/componentsController';

import {
    validateComponent,
    validateComponentForCreation,
} from '../middleware/validateComponent';

const router = express.Router();

router.get('/', getAllComponents); // Fetch all components
router.get('/search', searchComponents); // Search components with compatibilty
router.get('/search-without-compatibility', searchComponentsWithoutCompatibilty); // Search components without compatibilty
router.get('/compatible-motherboards',getCompatibleMotherboards);// Get compatible motherboards
router.post('/', validateComponentForCreation, addComponent); // Add a new component
router.put('/:id', validateComponent, updateComponent); // Update a component
router.delete('/:id', deleteComponent); // Delete a component

export default router;
