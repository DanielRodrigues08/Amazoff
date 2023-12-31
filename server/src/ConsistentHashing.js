import crypto from "crypto";

class ConsistentHashing {


    constructor(nodes = [], replicas = 5) {
        this.nodes         = new Map(); // { hash: node }
        this.listNodes     = nodes;
        this.replicas      = replicas;
        nodes.forEach(node => this.addNode(node));
    }

    addNode(node) {
        if (Array.from(this.nodes.values()).includes(node)) {
            return
        }

        for (let i = 0; i < this.replicas; i++) {
            const replicaKey = this.getReplicaKey(node, i);
            this.nodes.set(replicaKey, node);
        }
    }


    removeNode(node) {
        if (!Array.from(this.nodes.values()).includes(node)) {
            return
        }

        for (let i = 0; i < this.replicas; i++) {
            const replicaKey = this.getReplicaKey(node, i);
            this.nodes.delete(replicaKey);
        }
    }

    update(incomingNodes) {
        const existingNodes = new Set(this.nodes.values());

        const newNodes = incomingNodes.filter(node => !existingNodes.has(node));
        const removedNodes = Array.from(existingNodes).filter(node => !incomingNodes.includes(node));
        newNodes.forEach(node => this.addNode(node));
        removedNodes.forEach(node => this.removeNode(node));
    }

    getNode(key) {
        if (this.nodes.size === 0) {
            return null;
        }

        const hash           = this.hash(key);
        const keys           = Array.from(this.nodes.keys());
        const sortedKeys     = keys.sort();

        const uniqueNodesSet = new Set();
        const nodeArray      = [];

        for (const nodeHash of sortedKeys) {
            if (hash <= nodeHash) {
                const node = this.nodes.get(nodeHash);
                if (!uniqueNodesSet.has(node)) {
                    uniqueNodesSet.add(node);
                    nodeArray.push(node);
                }

            }
        }

        for (const nodeHash of sortedKeys) {
            if (hash <= nodeHash) {
                break;
            }
            const node = this.nodes.get(nodeHash);
            if (!uniqueNodesSet.has(node)) {
                uniqueNodesSet.add(node);
                nodeArray.push(node);
            }
        }

        return nodeArray;
    }

    getReplicaKey(node, replicaIndex) {
        return this.hash(`${node}-${replicaIndex}`);
    }

    hash(data) {
        return parseInt(crypto.createHash('md5').update(data).digest('hex'), 16);
    }

    getFormattedRingJSON() {
        const ringEntries = [];
        for (const [hash, node] of this.nodes) {
            ringEntries.push({hash, node});
        }
        ringEntries.sort((a, b) => a.hash - b.hash);
        return ringEntries.map(entry => ({hash: entry.hash, node: entry.node}));
    }

    getNodes() {
        //nodes will be a set
        const nodes = new Set();
        for (const node of this.nodes.values()) {
            nodes.add(node);
        }
        return Array.from(nodes);
    }
}

export {ConsistentHashing};