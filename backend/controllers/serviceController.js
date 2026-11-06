const pool = require("../config/db");
async function getAllServices(req,res) {
    try{
    const result=await pool.query("select * from services where is_active=TRUE")
    return res.json({
        success:true,
        data:result.rows
    })
    }catch(error){
        console.log("Get Services Error : ",error)
        return res.status(500).json({
            success:false,
            message:"Internal Server Error"
        })

    }
}

async function getServiceById(req, res) {
    try {
        const { id } = req.params
        if (!/^[1-9]\d*$/.test(id)) {
            return res.status(400).json({
                success: false,
                message: "Service ID must be a positive integer"
            })
        }
        const result = await pool.query("SELECT * FROM services WHERE id = $1 AND is_active = TRUE",[id])

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Service Not Found"
            })
        }
        return res.json({
            success: true,
            data: result.rows[0]
        })

    } catch (error) {
        console.error("Get Service By ID Error:", error)
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }
}


async function createService(req, res) {
    try {
        if (
            !req.body ||
            typeof req.body !== "object" ||
            Array.isArray(req.body)
        ) {
            return res.status(400).json({
                success: false,
                message: "Request Body Must Be A JSON Object"
            })
        }

        const { name, description, estimated_duration } = req.body

        if (
            typeof name !== "string" ||
            !name.trim() ||
            estimated_duration === undefined ||
            estimated_duration === null
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid Name And Estimated Duration Required"
            })
        }

        if (
            typeof estimated_duration !== "number" ||
            !Number.isSafeInteger(estimated_duration) ||
            estimated_duration <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Estimated Duration Must Be A Positive Integer"
            })
        }

        if (
            description !== undefined &&
            description !== null &&
            typeof description !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Description Must Be A String Or Null"
            })
        }

        const result = await pool.query(
            `INSERT INTO services (name, description, estimated_duration)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [
                name.trim(),
                description === undefined ? null : description,
                estimated_duration
            ]
        )

        return res.status(201).json({
            success: true,
            message: "Service Created Successfully",
            data: result.rows[0]
        })

    } catch (error) {
        console.error("Create Service Error:", error)

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }
}


async function updateService(req, res) {
    try {
        const { id } = req.params

        if (!/^[1-9]\d*$/.test(id)) {
            return res.status(400).json({
                success: false,
                message: "Service ID must be a positive integer"
            })
        }

        if (
            !req.body ||
            typeof req.body !== "object" ||
            Array.isArray(req.body)
        ) {
            return res.status(400).json({
                success: false,
                message: "Request Body Must Be A JSON Object"
            })
        }

        const { name, description, estimated_duration } = req.body

        if (
            name === undefined &&
            description === undefined &&
            estimated_duration === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "Provide At Least One Field To Update"
            })
        }

        if (
            name !== undefined &&
            (typeof name !== "string" || !name.trim())
        ) {
            return res.status(400).json({
                success: false,
                message: "Service Name Must Be A Non-Empty String"
            })
        }

        if (
            description !== undefined &&
            description !== null &&
            typeof description !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Description Must Be A String Or Null"
            })
        }

        if (
            estimated_duration !== undefined &&
            (
                typeof estimated_duration !== "number" ||
                !Number.isInteger(estimated_duration) ||
                estimated_duration <= 0
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Estimated Duration Must Be A Positive Integer"
            })
        }

        const fields = []
        const values = []
        let parameterIndex = 1

        if (name !== undefined) {
            fields.push(`name = $${parameterIndex++}`)
            values.push(name.trim())
        }

        if (description !== undefined) {
            fields.push(`description = $${parameterIndex++}`)
            values.push(description)
        }

        if (estimated_duration !== undefined) {
            fields.push(`estimated_duration = $${parameterIndex++}`)
            values.push(estimated_duration)
        }

        values.push(id)

        const query = `
            UPDATE services
            SET ${fields.join(", ")}
            WHERE id = $${parameterIndex}
              AND is_active = TRUE
            RETURNING *
        `

        const result = await pool.query(query, values)

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Service Not Found"
            })
        }

        return res.json({
            success: true,
            message: "Service Updated Successfully",
            data: result.rows[0]
        })

    } catch (error) {
        console.error("Update service error:", error)

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }
}


async function deactivateService(req, res) {
    const { id } = req.params

    if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) {
        return res.status(400).json({
            success: false,
            message: "Service ID must be a positive integer"
        })
    }

    let client
    let transactionStarted = false

    try {
        client = await pool.connect()

        await client.query("BEGIN")
        transactionStarted = true

        const serviceResult = await client.query(
            `SELECT id, name, is_active
             FROM services
             WHERE id = $1
             FOR UPDATE`,
            [id]
        )

        if (
            serviceResult.rows.length === 0 ||
            !serviceResult.rows[0].is_active
        ) {
            await client.query("ROLLBACK")
            transactionStarted = false

            return res.status(404).json({
                success: false,
                message: "Active Service Not Found"
            })
        }

        const sessionResult = await client.query(
            `SELECT id
             FROM queue_sessions
             WHERE service_id = $1
               AND status = 'ACTIVE'
             LIMIT 1`,
            [id]
        )

        if (sessionResult.rows.length > 0) {
            await client.query("ROLLBACK")
            transactionStarted = false

            return res.status(409).json({
                success: false,
                message: "Cannot Deactivate Service While A Queue Session Is Active"
            })
        }

        const result = await client.query(
            `UPDATE services
             SET is_active = FALSE
             WHERE id = $1
               AND is_active = TRUE
             RETURNING id, name, is_active`,
            [id]
        )

        if (result.rows.length === 0) {
            await client.query("ROLLBACK")
            transactionStarted = false

            return res.status(404).json({
                success: false,
                message: "Active Service Not Found"
            })
        }

        await client.query("COMMIT")
        transactionStarted = false

        return res.json({
            success: true,
            message: "Service Deactivated Successfully",
            data: result.rows[0]
        })

    } catch (error) {
        if (transactionStarted && client) {
            try {
                await client.query("ROLLBACK")
            } catch (rollbackError) {
                console.error("Rollback Error:", rollbackError)
            }
        }

        console.error("Deactivate Service Error:", error)

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })

    } finally {
        if (client) {
            client.release()
        }
    }
}

module.exports={getAllServices,getServiceById,createService,updateService,deactivateService}