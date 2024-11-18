import express from 'express';
import SessionBuild from '../models/sessionBuild';
import CachedQuery from '../models/cachedQuery';
import PcPartPickerData from '../models/pcPartPickerData';
import pcPartPickerData from '../models/pcPartPickerData';

const router = express.Router();

// Fetch all session builds
router.get('/session-builds', async (req, res) => {
    try {
        const builds = await SessionBuild.find();
        res.json(builds);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching session builds', error });
    }
});

// Fetch all cached queries
router.get('/cached-queries', async (req, res) => {
    try {
        const queries = await CachedQuery.find();
        res.json(queries);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching cached queries', error });
    }
});

// Fetch all PCPartPicker data
router.get('/pcpartpicker_data', async (req, res) => {
    try {      
        const data = await PcPartPickerData.find();
       // console.log('Fetched PcPartPickerData:', data); // Debug log
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching PCPartPicker data', error });
    }
});

export default router;
