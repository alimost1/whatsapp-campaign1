import axios from 'axios'

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY
const EVOLUTION_INSTANCE_NAME = process.env.EVOLUTION_INSTANCE_NAME

export async function sendWhatsAppMessage(phone: string, message: string) {
  if (!EVOLUTION_API_URL || !EVOLUTION_INSTANCE_NAME) {
    throw new Error('Evolution API not configured')
  }

  try {
    const response = await axios.post(
      `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE_NAME}`,
      {
        number: phone.replace(/\D/g, ''),
        textMessage: { text: message }
      },
      {
        headers: {
          apikey: EVOLUTION_API_KEY
        }
      }
    )

    return response.data
  } catch (error: any) {
    console.error('Failed to send WhatsApp message:', error.response?.data || error.message)
    throw new Error('Failed to send message')
  }
}

export async function getEvolutionStatus() {
  if (!EVOLUTION_API_URL || !EVOLUTION_INSTANCE_NAME) {
    throw new Error('Evolution API not configured')
  }

  try {
    const response = await axios.get(
      `${EVOLUTION_API_URL}/instance/connectionState/${EVOLUTION_INSTANCE_NAME}`,
      {
        headers: {
          apikey: EVOLUTION_API_KEY
        }
      }
    )

    return response.data
  } catch (error: any) {
    console.error('Failed to get Evolution status:', error.response?.data || error.message)
    return null
  }
}
