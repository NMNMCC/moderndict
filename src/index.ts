#!/usr/bin/env node

import "dotenv/config";
import { run, subcommands } from "cmd-ts";
import { scan } from "./commands/scan.js";
import { crop } from "./commands/crop.js";

const app = subcommands({
    name: "ModernDict",
    description: "Modern Dictionary Digitization Tool",
    cmds: {
        crop,
        scan,
    },
});

run(app, process.argv.slice(2));
