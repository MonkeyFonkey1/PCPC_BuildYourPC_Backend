import express from 'express';
import {
    getAllComponents,
    searchComponents,
    addComponent,
    updateComponent,
    deleteComponent,
} from '../controllers/componentsController';

import {
    validateComponent,
    validateComponentForCreation,
} from '../middleware/validateComponent';



const router = express.Router();


router.get('/', getAllComponents); // Fetch all components
router.get('/search', searchComponents); // Search components
router.post('/', validateComponentForCreation, addComponent); // Add a new component
router.put('/:id', validateComponent, updateComponent); // Update a component
router.delete('/:id', deleteComponent); // Delete a component

export default router;
