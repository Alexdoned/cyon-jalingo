import { useState } from 'react';
import { Box, Flex, HStack, Link, Button, VStack } from '@chakra-ui/react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { label: 'Home', path: '/' },
  { label: 'Leaders', path: '/leaders' },
  { label: 'Events', path: '/events' },
  { label: 'Register', path: '/register' },
  { label: 'Payment', path: '/payment' },
  { label: 'Admin Login', path: '/admin-login' },
];

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <Box
      bgGradient="linear(to-r, blue.800, blue.600)"
      color="white"
      px={{ base: 4, md: 28 }}
      py={3}
      boxShadow="2xl"
      position="sticky"
      top="0"
      zIndex="20"
      borderBottomWidth="1px"
      borderColor="whiteAlpha.200"
    >
      <Flex h={16} alignItems="center" justifyContent="space-between">
        <Flex align="center" gap={3}>
          <Box fontWeight="extrabold" letterSpacing="wide" fontSize={{ base: 'md', md: 'lg' }}>CYON JALINGO DIOCESE</Box>
        </Flex>

        <HStack spacing={3} display={{ base: 'none', md: 'flex' }} as="nav">
          {navItems.map((item) => (
            <Link
              key={item.label}
              as={NavLink}
              to={item.path}
              px={3}
              py={2}
              rounded="lg"
              fontWeight="medium"
              _hover={{ textDecoration: 'none', bg: 'whiteAlpha.200' }}
              _activeLink={{ color: 'cyan.100', fontWeight: 'bold' }}
            >
              {item.label}
            </Link>
          ))}
        </HStack>

        <Flex display={{ base: 'none', md: 'flex' }}>
          <Button as={NavLink} to="/" size="sm" colorScheme="cyan" variant="solid">
            Explore
          </Button>
        </Flex>

        <Box display={{ base: 'block', md: 'none' }} onClick={toggleMenu} cursor="pointer" fontSize="2xl" p={2}>
          {isOpen ? '✕' : '☰'}
        </Box>
      </Flex>

      {isOpen && (
        <Box pb={4} display={{ md: 'none' }}>
          <VStack as="nav" spacing={4} align="stretch" mt={4}>
            {navItems.map((item) => (
              <Link
                key={item.label}
                as={NavLink}
                to={item.path}
                onClick={toggleMenu}
                px={3}
                py={2}
                rounded="md"
                fontWeight="medium"
                _hover={{ textDecoration: 'none', bg: 'whiteAlpha.200' }}
                _activeLink={{ color: 'cyan.100', fontWeight: 'bold' }}
              >
                {item.label}
              </Link>
            ))}
            <Button as={NavLink} to="/" size="sm" colorScheme="cyan" variant="solid" onClick={toggleMenu}>
              Explore
            </Button>
          </VStack>
        </Box>
      )}
    </Box>
  );
}

export default Navbar;
