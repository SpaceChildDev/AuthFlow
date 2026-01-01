import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, Plus, RefreshCw, Key, ExternalLink } from "lucide-react";

// Mock data - This will come from Supabase later
const mockServices = [
  { id: 1, name: 'Github', slug: 'github', lastUsed: '2 mins ago', digits: 6 },
  { id: 2, name: 'AWS Console', slug: 'aws', lastUsed: '1 hour ago', digits: 6 },
  { id: 3, name: 'Shopify Admin', slug: 'shopify', lastUsed: 'Yesterday', digits: 6 },
];

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">AuthFlow Dashboard</h1>
            <p className="text-slate-500 dark:text-slate-400">Manage your automated 2FA tokens at the edge.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Service
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Total Services</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockServices.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">API Requests (24h)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,284</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Security Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">A+</div>
            </CardContent>
          </Card>
        </div>

        {/* Services Table */}
        <Card>
          <CardHeader>
            <CardTitle>Registered Services</CardTitle>
            <CardDescription>
              A list of services currently configured for automated TOTP generation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service Name</TableHead>
                  <TableHead>Slug / Identifier</TableHead>
                  <TableHead>Digits</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockServices.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-blue-500" />
                        {service.name}
                      </div>
                    </TableCell>
                    <TableCell><code>/{service.slug}</code></TableCell>
                    <TableCell>{service.digits}</TableCell>
                    <TableCell className="text-slate-500 text-sm">{service.lastUsed}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon">
                        <Key className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Documentation / Webhook Preview */}
        <Card className="bg-slate-900 text-slate-50 border-none shadow-xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-400" />
              Webhook Integration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-400 text-sm">
              Use this endpoint in n8n or any HTTP client to fetch tokens dynamically.
            </p>
            <div className="bg-slate-800 p-3 rounded-md font-mono text-xs overflow-x-auto border border-slate-700">
              <code>GET https://authflow.daiquiri.dev/api/otp/github?key=YOUR_API_KEY&raw=true</code>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}