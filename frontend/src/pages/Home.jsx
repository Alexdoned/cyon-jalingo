import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Heading,
  SimpleGrid,
  Text,
  Stack,
  Spinner,
  Badge,
  VStack,
} from '@chakra-ui/react';
import EventCard from '../components/EventCard';
import api from '../api/axiosConfig';
import { denaryOptions } from '../utils/denaryOptions';
import { denaryParishMap } from '../utils/denaryParishData';

function Home() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/events')
      .then((response) => setEvents((response.data.data || []).slice(0, 3)))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box py={12}>
      <Container maxW="7xl">
        <Box
          bg="whiteAlpha.85"
          borderRadius="3xl"
          p={{ base: 8, md: 12 }}
          boxShadow="2xl"
          border="1px solid"
          borderColor="whiteAlpha.200"
          backdropFilter="saturate(180%) blur(10px)"
        >
          <Stack spacing={6} textAlign="center">
            <Heading size="2xl" color="gray.400">Catholic Youth Org of Nig. Jalingo</Heading>
            <Text fontSize="lg" color="gray.600">
              Welcome to the youth portal for registration, deanery news, and event participation across the Jalingo Diocese.
            </Text>
            <Button mt={2} colorScheme="blue" size="lg" as={RouterLink} to="/register">
              Register Now
            </Button>
          </Stack>
        </Box>

        <Box mt={12}>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            <Box bg="whiteAlpha.85" borderRadius="3xl" p={6} boxShadow="2xl" border="1px solid" borderColor="whiteAlpha.200">
              <Badge colorScheme="purple" mb={4}>Deanery</Badge>
              <Heading size="md" mb={3}>Jalingo Diocese Deanery</Heading>
              <Text color="gray.600" mb={4}>
                The deanery brings youth leaders together to serve faith, community, and mission through events, training, and fellowship.
              </Text>
              <Text fontWeight="bold">Focus areas:</Text>
              <VStack align="start" spacing={2} mt={2}>
                <Text>• Leadership development</Text>
                <Text>• Parish engagement</Text>
                <Text>• Community outreach</Text>
              </VStack>
            </Box>

            <Box bg="whiteAlpha.85" borderRadius="3xl" p={6} boxShadow="2xl" border="1px solid" borderColor="whiteAlpha.200">
              <Badge colorScheme="green" mb={4}>Registration</Badge>
              <Heading size="md" mb={3}>Become a member</Heading>
              <Text color="gray.600" mb={4}>
                Register for youth membership to participate in programs, receive updates, and get access to events and leadership training.
              </Text>
              <Button as={RouterLink} to="/register" colorScheme="green">Start Registration</Button>
            </Box>

            <Box bg="whiteAlpha.85" borderRadius="3xl" p={6} boxShadow="2xl" border="1px solid" borderColor="whiteAlpha.200">
              <Badge colorScheme="teal" mb={4}>Payment</Badge>
              <Heading size="md" mb={3}>Payment Information</Heading>
              <Text color="gray.600" mb={4}>
                Use the account below for payments and contributions to the Catholic Youth Organization of Nigeria, Jalingo.
              </Text>
              <Text fontWeight="bold">Bank:</Text>
              <Text>Zenith Bank</Text>
              <Text fontWeight="bold" mt={3}>Account Number:</Text>
              <Text>1013883316</Text>
            </Box>
          </SimpleGrid>
        </Box>

        <Box mt={12}>
          <Heading size="lg" mb={6} color="white">All Denaries</Heading>
          <Box bg="whiteAlpha.85" borderRadius="3xl" p={6} boxShadow="2xl" border="1px solid" borderColor="whiteAlpha.200">
            <Text color="gray.600" mb={4}>Click any denary to see events filtered by that region.</Text>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {denaryOptions.map((denary) => (
                <Box
                  key={denary}
                  bg="white"
                  borderRadius="2xl"
                  p={6}
                  boxShadow="md"
                  display="flex"
                  flexDirection="column"
                  _hover={{ boxShadow: 'lg', transform: 'translateY(-2px)' }}
                  transition="all 0.2s"
                >
                  <Button
                    as={RouterLink}
                    to={`/events?denary=${encodeURIComponent(denary)}`}
                    variant="solid"
                    colorScheme="blue"
                    width="100%"
                    mb={4}
                    size="lg"
                  >
                    <Text fontWeight="bold" textTransform="capitalize">{denary} Deanery</Text>
                  </Button>
                  <Heading size="sm" mb={2} color="gray.800">Parishes:</Heading>
                  <VStack align="start" spacing={1}>
                    {denaryParishMap[denary]?.map((parish, idx) => (
                      <Text key={idx} fontSize="sm" color="gray.600">
                        • {parish}
                      </Text>
                    ))}
                  </VStack>
                </Box>
              ))}
            </SimpleGrid>
          </Box>
        </Box>

        <Box mt={12}>
          <Heading size="lg" mb={6} color="white">Upcoming Events</Heading>
          {loading ? (
            <Spinner color="white" />
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {events.length > 0 ? (
                events.map((event) => <EventCard key={event.id || event._id} event={event} />)
              ) : (
                <Text color="white">No events available yet.</Text>
              )}
            </SimpleGrid>
          )}
        </Box>

        <Box mt={16} bg="whiteAlpha.85" borderRadius="3xl" p={{ base: 6, md: 8 }} border="1px solid" borderColor="whiteAlpha.200" boxShadow="2xl">
          <Stack spacing={4} textAlign="center">
            <Heading size="lg">Stay connected</Heading>
            <Text color="gray.600">
              Register today and use the Zenith Bank account above to complete payment. Join the Catholic Youth Org of Nig. Jalingo for fellowship, service, and growth.
            </Text>
            <Text color="gray.600">Account: 1013883316 | Zenith Bank</Text>
            <Text color="gray.600">Church: Catholic Youth Org of Nig. Jalingo</Text>
            <Button as={RouterLink} to="/register" colorScheme="blue" alignSelf="center">Register and Pay</Button>
          </Stack>
        </Box>

        <Box mt={12} py={8} bg="blackAlpha.60" borderRadius="3xl" textAlign="center">
          <Text color="white" fontWeight="bold">Catholic Youth Org of Nig. Jalingo</Text>
          <Text color="whiteAlpha.800">Zenith Bank — Account Number: 1013883316</Text>
          <Text color="whiteAlpha.800">Register on the homepage and follow the payment details above.</Text>
        </Box>
      </Container>
    </Box>
  );
}

export default Home;
