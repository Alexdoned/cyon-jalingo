import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  Text,
  useToast,
} from '@chakra-ui/react';
import api, { setAuthToken } from '../api/axiosConfig';

function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/admin/login', { username, password });
      localStorage.setItem('token', response.data.token);
      setAuthToken(response.data.token);
      toast({ title: 'Login successful', status: 'success', duration: 3000, isClosable: true });
      navigate('/admin-dashboard');
    } catch (error) {
      toast({ title: 'Login failed', description: 'Please check your credentials.', status: 'error', duration: 4000, isClosable: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box py={12}>
      <Container maxW="md">
        <Box
          bg="whiteAlpha.90"
          p={{ base: 6, md: 8 }}
          borderRadius="3xl"
          boxShadow="2xl"
          border="1px solid"
          borderColor="whiteAlpha.200"
          backdropFilter="saturate(180%) blur(20px)"
        >
          <Heading mb={6} textAlign="center">Admin Login</Heading>
        <form onSubmit={handleSubmit}>
          <Stack spacing={4}>
            <FormControl id="username" isRequired>
              <FormLabel>Username</FormLabel>
              <Input value={username} onChange={(event) => setUsername(event.target.value)} />
            </FormControl>
            <FormControl id="password" isRequired>
              <FormLabel>Password</FormLabel>
              <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
            </FormControl>
            <Button type="submit" colorScheme="blue" isLoading={loading}>Sign In</Button>
          </Stack>
        </form>
        <Text mt={4} color="gray.600" fontSize="sm">
          Use your admin username and password to access the protected dashboard.
        </Text>
      </Box>
    </Container>
  </Box>
  );
}

export default AdminLogin;
