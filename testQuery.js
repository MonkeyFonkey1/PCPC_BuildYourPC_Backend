const { MongoClient } = require("mongodb");

(async () => {
    uri="mongodb+srv://MonkeyFonkey:%40ndrei2005@licentadbcluster.qiizw.mongodb.net/pcpc-build-your-pc?retryWrites=true&w=majority";
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log("Connected to MongoDB...");

        const db = client.db("pcpc-build-your-pc");
        const collection = db.collection("components");

        // Test data (normalized model names)
        const normalizedModelNames = [
            "ryzen 5 5600x",
            "asus prime z490-a",
            "corsair vengeance ddr5 16gb",
            "cooler master 500w",
            "nvidia rtx 3080",
            "nzxt h510",
            "samsung 970 evo plus 1tb",
        ];

        console.log("Querying for components...");
        const results = await collection
            .find({ modelName: { $in: normalizedModelNames } })
            .toArray();

        console.log("Fetched components:", results);

        const missingComponents = normalizedModelNames.filter(
            (name) => !results.some((c) => c.modelName.trim().toLowerCase() === name)
        );

        if (missingComponents.length > 0) {
            console.error("Missing components:", missingComponents);
        } else {
            console.log("All components found!");
        }
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await client.close();
    }
})();
