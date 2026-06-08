import { Box, Container, Heading, Text, Stack, Button } from '@chakra-ui/react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function PaymentSuccess() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const payment = state?.payment;
  const registration = state?.registration;

  return (
    <Box py={12}>
      <Container maxW="3xl">
        <Stack spacing={6} bg="whiteAlpha.90" p={{ base: 6, md: 10 }} borderRadius="3xl" boxShadow="2xl">
          <Heading>Payment Successful</Heading>
          <Text>Thank you{registration ? `, ${registration.name}` : ''} — your payment was completed.</Text>
          {payment && (
            <Box>
              <Text><strong>Transaction ID:</strong> {payment.transactionId}</Text>
              <Text><strong>Amount:</strong> ${payment.amount}</Text>
              <Text><strong>Status:</strong> {payment.status}</Text>
            </Box>
          )}

          <Stack direction="row" spacing={3} pt={4}>
            <Button colorScheme="cyan" onClick={() => navigate('/')}>Return Home</Button>
            <Button variant="outline" onClick={() => navigate('/events')}>View Events</Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
