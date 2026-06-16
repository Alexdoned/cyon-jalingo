import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Select,
  Stack,
  Text,
  useToast,
  VStack,
} from '@chakra-ui/react';
import api from '../api/axiosConfig';

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const [registration, setRegistration] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({ paymentMethod: 'card', cardNumber: '', expiryDate: '', cvv: '', cardholderName: '' });

  const registrationId = location.state?.registrationId || new URLSearchParams(location.search).get('id');

  useEffect(() => {
    if (registrationId) {
      api.get(`/register/${registrationId}`).then((res) => setRegistration(res.data?.data || res.data)).catch(() => { });
    }
  }, [registrationId]);

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handlePay = async () => {
    if (!registrationId) {
      toast({ title: 'Missing registration', status: 'error', duration: 3000, isClosable: true });
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        registrationId,
        amount: 25,
        paymentMethod: form.paymentMethod,
        cardNumber: form.cardNumber,
        expiryDate: form.expiryDate,
        cvv: form.cvv,
        cardholderName: form.cardholderName,
        email: registration?.email || '',
      };

      const res = await api.post('/payment/process', payload);
      toast({ title: 'Payment successful', description: `Transaction ${res.data?.payment?.transactionId || ''}`, status: 'success', duration: 4000, isClosable: true });
      navigate('/payment-success', { state: { payment: res.data?.payment, registration } });
    } catch (error) {
      toast({ title: 'Payment failed', status: 'error', duration: 4000, isClosable: true });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box py={12}>
      <Container maxW="3xl">
        <Stack spacing={8} bg="whiteAlpha.90" p={{ base: 6, md: 10 }} borderRadius="3xl" boxShadow="2xl" border="1px solid" borderColor="whiteAlpha.200">
          <Box textAlign="center">
            <Heading>Payment</Heading>
            <Text mt={3} color="gray.600">Complete the payment for your registration.</Text>
          </Box>

          {registration && (
            <Box>
              <Text><strong>Name:</strong> {registration.name}</Text>
              <Text><strong>Email:</strong> {registration.email}</Text>
              <Text><strong>Denary:</strong> {registration.denary}</Text>
              <Text><strong>Parish:</strong> {registration.parish}</Text>
            </Box>
          )}

          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel>Payment Method</FormLabel>
              <Select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
                <option value="card">Card</option>
                <option value="mobile">Mobile</option>
              </Select>
            </FormControl>

            {form.paymentMethod === 'card' && (
              <>
                <FormControl>
                  <FormLabel>Card Number</FormLabel>
                  <Input value={form.cardNumber} onChange={handleChange('cardNumber')} placeholder="4242 4242 4242 4242" />
                </FormControl>
                <FormControl>
                  <FormLabel>Expiry Date</FormLabel>
                  <Input value={form.expiryDate} onChange={handleChange('expiryDate')} placeholder="MM/YY" />
                </FormControl>
                <FormControl>
                  <FormLabel>CVV</FormLabel>
                  <Input value={form.cvv} onChange={handleChange('cvv')} placeholder="123" />
                </FormControl>
                <FormControl>
                  <FormLabel>Cardholder Name</FormLabel>
                  <Input value={form.cardholderName} onChange={handleChange('cardholderName')} placeholder="Name on card" />
                </FormControl>
              </>
            )}
          </VStack>

          <Stack direction={{ base: 'column', md: 'row' }} justify="flex-end">
            <Button variant="outline" onClick={() => navigate('/register')}>Back to Registration</Button>
            <Button colorScheme="green" onClick={handlePay} isLoading={isLoading}>Pay</Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
