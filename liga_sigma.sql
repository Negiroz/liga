-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 16-07-2025 a las 01:10:44
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `liga_sigma`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `agentes_atc`
--

CREATE TABLE `agentes_atc` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `photoUrl` mediumtext DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `agentes_atc`
--

INSERT INTO `agentes_atc` (`id`, `name`, `photoUrl`) VALUES
(3, 'nuevo 2', 'uploads/agentes_atc/agente_6869ce73f187d0.98575577.png'),
(4, 'Nuevo 3', 'uploads/agentes_atc/agente_6869ce87950d72.73143933.png'),
(5, 'Nuevo 4', 'uploads/agentes_atc/agente_6869ce94d7bfe8.41150137.png'),
(6, 'cinco', 'uploads/agentes_atc/agente_6869cea0aeb299.00634148.png');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `agentes_campo`
--

CREATE TABLE `agentes_campo` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `photoUrl` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `agentes_campo`
--

INSERT INTO `agentes_campo` (`id`, `name`, `photoUrl`) VALUES
(2, 'Agente 1', 'uploads/agentes_campo/campo_686bbac7d0a5e4.53998510.png'),
(3, 'Agente 2', 'uploads/agentes_campo/campo_686bbad3986c77.18056900.png');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `closers`
--

CREATE TABLE `closers` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `photoUrl` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `closers`
--

INSERT INTO `closers` (`id`, `name`, `photoUrl`) VALUES
(1, 'Albenis', 'uploads/closers/closer_6876da0eddec91.11977551.png'),
(2, 'ramiro', 'uploads/closers/closer_6876da04507d11.53541274.png'),
(3, 'edxuardoi', 'uploads/closers/closer_6876d9fb1dc759.60752825.png');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `kpi_entries`
--

CREATE TABLE `kpi_entries` (
  `id` int(11) NOT NULL,
  `closerId` int(11) NOT NULL,
  `date` date NOT NULL,
  `oportunidadesAsignadas` int(11) DEFAULT 0,
  `cierresLogrados` int(11) DEFAULT 0,
  `ingresosTotales` decimal(10,2) DEFAULT 0.00,
  `calificacionPitch` decimal(3,2) DEFAULT 0.00,
  `actividadesAsignadas` int(11) DEFAULT 0,
  `actividadesCompletadas` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `kpi_entries_atc`
--

CREATE TABLE `kpi_entries_atc` (
  `id` int(11) NOT NULL,
  `agenteId` int(11) NOT NULL,
  `date` date NOT NULL,
  `soportesAtendidos` int(11) DEFAULT 0,
  `ticketsGenerados` int(11) DEFAULT 0,
  `pagosRegistrados` int(11) DEFAULT 0,
  `actividadesAsignadas` int(11) DEFAULT 0,
  `actividadesCompletadas` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `kpi_entries_atc`
--

INSERT INTO `kpi_entries_atc` (`id`, `agenteId`, `date`, `soportesAtendidos`, `ticketsGenerados`, `pagosRegistrados`, `actividadesAsignadas`, `actividadesCompletadas`) VALUES
(1, 6, '2025-07-06', 10, 0, 0, 0, 0),
(2, 6, '2025-07-06', 0, 20, 5, 30, 0),
(3, 3, '2025-07-06', 9, 8, 7, 6, 5),
(4, 4, '2025-07-06', 9, 8, 7, 6, 5),
(5, 5, '2025-07-06', 3, 4, 5, 6, 7);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `kpi_entries_campo`
--

CREATE TABLE `kpi_entries_campo` (
  `id` int(11) NOT NULL,
  `agenteId` int(11) NOT NULL,
  `date` date NOT NULL,
  `prospectosCualificados` int(11) DEFAULT 0,
  `oportunidadesConvertidas` int(11) DEFAULT 0,
  `arpuProspectos` decimal(10,2) DEFAULT 0.00,
  `actividadesAsignadas` int(11) DEFAULT 0,
  `actividadesCompletadas` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `kpi_entries_campo`
--

INSERT INTO `kpi_entries_campo` (`id`, `agenteId`, `date`, `prospectosCualificados`, `oportunidadesConvertidas`, `arpuProspectos`, `actividadesAsignadas`, `actividadesCompletadas`) VALUES
(1, 2, '2025-07-07', 5, 2, 22.00, 10, 8),
(2, 3, '2025-07-07', 4, 3, 22.00, 10, 7),
(3, 2, '2025-07-06', 10, 4, 25.00, 10, 8),
(4, 3, '2025-07-06', 8, 3, 22.00, 10, 5);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `kpi_objectives`
--

CREATE TABLE `kpi_objectives` (
  `id` int(11) NOT NULL,
  `objective_key` varchar(255) NOT NULL,
  `objective_value` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `kpi_objectives`
--

INSERT INTO `kpi_objectives` (`id`, `objective_key`, `objective_value`) VALUES
(1, 'closer_cierre_meta', '40'),
(2, 'closer_plan_caro', '30'),
(3, 'campo_meta_prospectos', '143'),
(4, 'campo_meta_cierres', '50'),
(5, 'campo_ref_plan_caro', '30');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(50) NOT NULL DEFAULT 'user'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `role`) VALUES
(1, 'admin', '$2y$10$o5qW2wDHHW4X0xmPnI1TOuWHuyGXzWOt983WHiz56LFXzLlx2Br1m', 'admin');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `versus_entries_atc`
--

CREATE TABLE `versus_entries_atc` (
  `id` int(11) NOT NULL,
  `winner_id` int(11) DEFAULT NULL,
  `loser_id` int(11) DEFAULT NULL,
  `is_draw` tinyint(1) DEFAULT 0,
  `points_change` int(11) NOT NULL,
  `challenge_description` text DEFAULT NULL,
  `date` date NOT NULL,
  `agente1_id` int(11) NOT NULL,
  `agente2_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `versus_entries_atc`
--

INSERT INTO `versus_entries_atc` (`id`, `winner_id`, `loser_id`, `is_draw`, `points_change`, `challenge_description`, `date`, `agente1_id`, `agente2_id`) VALUES
(2, 3, 6, 0, 100, 'Desafío del día', '2025-07-06', 6, 3),
(3, 4, 5, 0, 100, 'Desafío del día', '2025-07-06', 5, 4);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `versus_entries_campo`
--

CREATE TABLE `versus_entries_campo` (
  `id` int(11) NOT NULL,
  `date` date NOT NULL,
  `agente1_id` int(11) NOT NULL,
  `agente2_id` int(11) NOT NULL,
  `challenge_description` text DEFAULT NULL,
  `winner_id` int(11) DEFAULT NULL,
  `loser_id` int(11) DEFAULT NULL,
  `is_draw` tinyint(1) DEFAULT 0,
  `points_change` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `versus_entries_campo`
--

INSERT INTO `versus_entries_campo` (`id`, `date`, `agente1_id`, `agente2_id`, `challenge_description`, `winner_id`, `loser_id`, `is_draw`, `points_change`) VALUES
(1, '2025-07-07', 2, 3, 'Desafío del día', 3, 2, 0, 100),
(2, '2025-07-06', 3, 2, 'Desafío del día', 2, 3, 0, 100);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `versus_entries_closers`
--

CREATE TABLE `versus_entries_closers` (
  `id` int(11) NOT NULL,
  `date` date NOT NULL,
  `closer1_id` int(11) NOT NULL,
  `closer2_id` int(11) NOT NULL,
  `challenge_description` text DEFAULT NULL,
  `winner_id` int(11) DEFAULT NULL,
  `loser_id` int(11) DEFAULT NULL,
  `is_draw` tinyint(1) DEFAULT 0,
  `points_change` int(11) DEFAULT 100
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `agentes_atc`
--
ALTER TABLE `agentes_atc`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `agentes_campo`
--
ALTER TABLE `agentes_campo`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `closers`
--
ALTER TABLE `closers`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `kpi_entries`
--
ALTER TABLE `kpi_entries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `closerId` (`closerId`);

--
-- Indices de la tabla `kpi_entries_atc`
--
ALTER TABLE `kpi_entries_atc`
  ADD PRIMARY KEY (`id`),
  ADD KEY `agenteId` (`agenteId`);

--
-- Indices de la tabla `kpi_entries_campo`
--
ALTER TABLE `kpi_entries_campo`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_agente_campo_date` (`agenteId`,`date`);

--
-- Indices de la tabla `kpi_objectives`
--
ALTER TABLE `kpi_objectives`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `objective_key` (`objective_key`);

--
-- Indices de la tabla `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indices de la tabla `versus_entries_atc`
--
ALTER TABLE `versus_entries_atc`
  ADD PRIMARY KEY (`id`),
  ADD KEY `winner_id` (`winner_id`),
  ADD KEY `fk_agente1` (`agente1_id`),
  ADD KEY `fk_agente2` (`agente2_id`),
  ADD KEY `fk_loser` (`loser_id`);

--
-- Indices de la tabla `versus_entries_campo`
--
ALTER TABLE `versus_entries_campo`
  ADD PRIMARY KEY (`id`),
  ADD KEY `agente1_id` (`agente1_id`),
  ADD KEY `agente2_id` (`agente2_id`),
  ADD KEY `winner_id` (`winner_id`),
  ADD KEY `loser_id` (`loser_id`);

--
-- Indices de la tabla `versus_entries_closers`
--
ALTER TABLE `versus_entries_closers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `closer1_id` (`closer1_id`),
  ADD KEY `closer2_id` (`closer2_id`),
  ADD KEY `winner_id` (`winner_id`),
  ADD KEY `loser_id` (`loser_id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `agentes_atc`
--
ALTER TABLE `agentes_atc`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `agentes_campo`
--
ALTER TABLE `agentes_campo`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `closers`
--
ALTER TABLE `closers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `kpi_entries`
--
ALTER TABLE `kpi_entries`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `kpi_entries_atc`
--
ALTER TABLE `kpi_entries_atc`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `kpi_entries_campo`
--
ALTER TABLE `kpi_entries_campo`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `kpi_objectives`
--
ALTER TABLE `kpi_objectives`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT de la tabla `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `versus_entries_atc`
--
ALTER TABLE `versus_entries_atc`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `versus_entries_campo`
--
ALTER TABLE `versus_entries_campo`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `versus_entries_closers`
--
ALTER TABLE `versus_entries_closers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `kpi_entries`
--
ALTER TABLE `kpi_entries`
  ADD CONSTRAINT `kpi_entries_ibfk_1` FOREIGN KEY (`closerId`) REFERENCES `closers` (`id`);

--
-- Filtros para la tabla `kpi_entries_atc`
--
ALTER TABLE `kpi_entries_atc`
  ADD CONSTRAINT `kpi_entries_atc_ibfk_1` FOREIGN KEY (`agenteId`) REFERENCES `agentes_atc` (`id`);

--
-- Filtros para la tabla `kpi_entries_campo`
--
ALTER TABLE `kpi_entries_campo`
  ADD CONSTRAINT `kpi_entries_campo_ibfk_1` FOREIGN KEY (`agenteId`) REFERENCES `agentes_campo` (`id`);

--
-- Filtros para la tabla `versus_entries_atc`
--
ALTER TABLE `versus_entries_atc`
  ADD CONSTRAINT `fk_agente1` FOREIGN KEY (`agente1_id`) REFERENCES `agentes_atc` (`id`),
  ADD CONSTRAINT `fk_agente2` FOREIGN KEY (`agente2_id`) REFERENCES `agentes_atc` (`id`),
  ADD CONSTRAINT `fk_loser` FOREIGN KEY (`loser_id`) REFERENCES `agentes_atc` (`id`),
  ADD CONSTRAINT `versus_entries_atc_ibfk_1` FOREIGN KEY (`winner_id`) REFERENCES `agentes_atc` (`id`);

--
-- Filtros para la tabla `versus_entries_campo`
--
ALTER TABLE `versus_entries_campo`
  ADD CONSTRAINT `versus_entries_campo_ibfk_1` FOREIGN KEY (`agente1_id`) REFERENCES `agentes_campo` (`id`),
  ADD CONSTRAINT `versus_entries_campo_ibfk_2` FOREIGN KEY (`agente2_id`) REFERENCES `agentes_campo` (`id`),
  ADD CONSTRAINT `versus_entries_campo_ibfk_3` FOREIGN KEY (`winner_id`) REFERENCES `agentes_campo` (`id`),
  ADD CONSTRAINT `versus_entries_campo_ibfk_4` FOREIGN KEY (`loser_id`) REFERENCES `agentes_campo` (`id`);

--
-- Filtros para la tabla `versus_entries_closers`
--
ALTER TABLE `versus_entries_closers`
  ADD CONSTRAINT `versus_entries_closers_ibfk_1` FOREIGN KEY (`closer1_id`) REFERENCES `closers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `versus_entries_closers_ibfk_2` FOREIGN KEY (`closer2_id`) REFERENCES `closers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `versus_entries_closers_ibfk_3` FOREIGN KEY (`winner_id`) REFERENCES `closers` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `versus_entries_closers_ibfk_4` FOREIGN KEY (`loser_id`) REFERENCES `closers` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
