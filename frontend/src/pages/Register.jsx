import { useState } from 'react';
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
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { denaryOptions } from '../utils/denaryOptions';
import getParishOptions from '../utils/parishOptions';

const defaultValues = {
  name: '',
  email: '',
  phone: '',
  address: '',
  occupation: '',
  denary: '',
  parish: '',
};

export default function Register() {
  const [formData, setFormData] = useState(defaultValues);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const handleChange = (field) => (e) => setFormData({ ...formData, [field]: e.target.value });

  const handleSubmit = async () => {
    const { denary, parish, name, phone, email, address, occupation } = formData;
    if (!denary || !parish || !name || !phone || !email || !address || !occupation) {
      toast({ title: 'Please complete all fields.', status: 'error', duration: 4000, isClosable: true });
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post('/register', formData);
      const registrationId = res?.data?.id || res?.data?.data?.id;
      toast({ title: 'Registration submitted', description: 'Proceed to payment to complete.', status: 'success', duration: 3000, isClosable: true });
      navigate('/payment', { state: { registrationId } });
    } catch (error) {
      toast({ title: 'Registration failed', status: 'error', duration: 4000, isClosable: true });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box py={12}>
      <Container maxW="3xl">
        <Stack
          spacing={8}
          bg="whiteAlpha.90"
          p={{ base: 6, md: 10 }}
          borderRadius="3xl"
          boxShadow="2xl"
          border="1px solid"
          borderColor="whiteAlpha.200"
          backdropFilter="saturate(180%) blur(20px)"
        >
          <Box textAlign="center">
            <Heading>Membership Registration</Heading>
            <Text mt={3} color="gray.600">Fill your details below to register. Payment is handled on the next page.</Text>
          </Box>

          <VStack spacing={6} align="stretch">
            <FormControl id="name" isRequired>
              <FormLabel>Full Name</FormLabel>
              <Input value={formData.name} onChange={handleChange('name')} placeholder="Enter your full name" />
            </FormControl>

            <FormControl id="email" isRequired>
              <FormLabel>Email</FormLabel>
              <Input type="email" value={formData.email} onChange={handleChange('email')} placeholder="Enter your email" />
            </FormControl>

            <FormControl id="phone" isRequired>
              <FormLabel>Phone</FormLabel>
              <Input value={formData.phone} onChange={handleChange('phone')} placeholder="Phone e.g. +1234567890" />
            </FormControl>

            <FormControl id="address" isRequired>
              <FormLabel>Address</FormLabel>
              <Input value={formData.address} onChange={handleChange('address')} placeholder="Postal address" />
            </FormControl>

            <FormControl id="occupation" isRequired>
              <FormLabel>Occupation</FormLabel>
              <Input value={formData.occupation} onChange={handleChange('occupation')} placeholder="e.g. Student, Teacher" />
            </FormControl>

            <FormControl id="denary" isRequired>
              <FormLabel>Denary</FormLabel>
              <Select placeholder="Select denary" value={formData.denary} onChange={handleChange('denary')}> 
                {denaryOptions.map((d) => (<option key={d} value={d}>{d}</option>))}
              </Select>
            </FormControl>

            <FormControl id="parish" isRequired>
              <FormLabel>Parish</FormLabel>
              <Select placeholder="Select parish" value={formData.parish} onChange={handleChange('parish')}> 
                {getParishOptions(formData.denary).map((p) => (<option key={p} value={p}>{p}</option>))}
              </Select>
            </FormControl>
          </VStack>

          <Stack direction={{ base: 'column', md: 'row' }} justify="flex-end">
            <Button colorScheme="blue" onClick={handleSubmit} isLoading={isLoading}>Submit & Continue to Payment</Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
