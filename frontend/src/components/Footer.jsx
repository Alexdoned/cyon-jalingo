import { Box, Container, Flex, Heading, Stack, Text, Link } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';

export default function Footer() {
  return (
    <Box as="footer" bg="blackAlpha.40" color="whiteAlpha.900" py={8} mt={12}>
      <Container maxW="9xl" px={{ base: 4, md: 28 }}>
        <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align="flex-start" gap={8}>
          <Stack spacing={3} flex="1">
            <Heading size="md">Catholic Youth Org of Nig. Jalingo</Heading>
            <Text>Join the youth movement that builds faith, leadership, and community in the Jalingo Diocese.</Text>
          </Stack>

          <Stack spacing={2} flex="1">
            <Text fontWeight="bold">Payment Account</Text>
            <Text>Zenith Bank</Text>
            <Text>Account Number: 1013883316</Text>
          </Stack>

          <Stack spacing={2} flex="1">
            <Text fontWeight="bold">Quick links</Text>
            <Link as={RouterLink} to="/register" _hover={{ textDecoration: 'underline' }}>Register</Link>
            <Link as={RouterLink} to="/payment" _hover={{ textDecoration: 'underline' }}>Payment</Link>
            <Link as={RouterLink} to="/events" _hover={{ textDecoration: 'underline' }}>Events</Link>
          </Stack>
        </Flex>
        <Text textAlign="center" mt={8} color="whiteAlpha.700">Catholic Youth Org of Nig. Jalingo — Zenith Bank 1013883316</Text>
      </Container>
    </Box>
  );
}
